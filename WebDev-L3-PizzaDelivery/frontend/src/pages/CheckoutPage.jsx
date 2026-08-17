import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  Home,
  ShoppingBag,
  Truck,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const RAZORPAY_SCRIPT_URL =
  "https://checkout.razorpay.com/v1/checkout.js";

const loadCart = () => {
  try {
    const savedCart = JSON.parse(
      localStorage.getItem("pizzaCart") || "[]"
    );

    return Array.isArray(savedCart)
      ? savedCart
      : [];
  } catch {
    return [];
  }
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
    );

    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");

    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cart] = useState(loadCart);

  const [paymentMethod, setPaymentMethod] =
    useState("cod");

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [completedOrder, setCompletedOrder] =
    useState(null);

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    postalCode: "",
  });

  useEffect(() => {
    if (user?.name && !formData.fullName) {
      setFormData((previous) => ({
        ...previous,
        fullName: user.name,
      }));
    }
  }, [user, formData.fullName]);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        Number(item.price || 0) *
          Number(item.quantity || 1),
      0
    );
  }, [cart]);

  const deliveryFee =
    cart.length > 0 ? 40 : 0;

  const totalAmount =
    subtotal + deliveryFee;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateAndCreateAddress = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      navigate("/cart");
      return null;
    }

    const requiredFields = [
      "fullName",
      "phone",
      "addressLine",
      "city",
      "state",
      "postalCode",
    ];

    const missingField = requiredFields.find(
      (field) =>
        !String(formData[field] || "").trim()
    );

    if (missingField) {
      toast.error(
        "Please complete the delivery address"
      );
      return null;
    }

    const phone = formData.phone.trim();
    const postalCode =
      formData.postalCode.trim();

    if (!/^[0-9+\-\s]{10,15}$/.test(phone)) {
      toast.error(
        "Enter a valid phone number"
      );
      return null;
    }

    if (
      !/^[A-Za-z0-9\-\s]{4,10}$/.test(
        postalCode
      )
    ) {
      toast.error(
        "Enter a valid postal code"
      );
      return null;
    }

    return {
      fullName: formData.fullName.trim(),
      phone,
      addressLine:
        formData.addressLine.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      postalCode,
    };
  };

  const completeOrder = (order, message) => {
    localStorage.removeItem("pizzaCart");
    setCompletedOrder(order);
    toast.success(message);
  };

  const placeCodOrder = async (
    deliveryAddress
  ) => {
    setPlacingOrder(true);

    try {
      const response = await api.post(
        "/orders",
        {
          items: cart,
          deliveryAddress,
          paymentMethod: "cod",
        }
      );

      completeOrder(
        response.data.order,
        "Order placed successfully"
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to place your order"
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const placeRazorpayOrder = async (
    deliveryAddress
  ) => {
    setPlacingOrder(true);

    try {
      const scriptLoaded =
        await loadRazorpayScript();

      if (
        !scriptLoaded ||
        !window.Razorpay
      ) {
        throw new Error(
          "Unable to load Razorpay Checkout"
        );
      }

      const createResponse = await api.post(
        "/orders/razorpay/create",
        {
          items: cart,
          deliveryAddress,
          paymentMethod: "razorpay",
        }
      );

      const paymentData =
        createResponse.data;

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "Pizza Delivery",
        description:
          "Pizza order payment",
        order_id:
          paymentData.razorpayOrderId,

        prefill: {
          name: deliveryAddress.fullName,
          email: user?.email || "",
          contact: deliveryAddress.phone,
        },

        notes: {
          localOrderId:
            paymentData.localOrderId,
        },

        theme: {
          color: "#d62828",
        },

        retry: {
          enabled: true,
        },

        modal: {
          ondismiss: () => {
            setPlacingOrder(false);

            toast.error(
              "Razorpay payment was cancelled"
            );
          },
        },

        handler: async (
          razorpayResponse
        ) => {
          try {
            const verifyResponse =
              await api.post(
                "/orders/razorpay/verify",
                {
                  localOrderId:
                    paymentData.localOrderId,

                  razorpay_order_id:
                    razorpayResponse.razorpay_order_id,

                  razorpay_payment_id:
                    razorpayResponse.razorpay_payment_id,

                  razorpay_signature:
                    razorpayResponse.razorpay_signature,
                }
              );

            completeOrder(
              verifyResponse.data.order,
              "Payment successful and order placed"
            );
          } catch (error) {
            toast.error(
              error.response?.data?.message ||
                "Payment verification failed"
            );
          } finally {
            setPlacingOrder(false);
          }
        },
      };

      const razorpayCheckout =
        new window.Razorpay(options);

      razorpayCheckout.on(
        "payment.failed",
        (response) => {
          setPlacingOrder(false);

          toast.error(
            response.error?.description ||
              "Razorpay payment failed"
          );
        }
      );

      razorpayCheckout.open();
    } catch (error) {
      setPlacingOrder(false);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to start Razorpay payment"
      );
    }
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    const deliveryAddress =
      validateAndCreateAddress();

    if (!deliveryAddress) {
      return;
    }

    if (paymentMethod === "razorpay") {
      await placeRazorpayOrder(
        deliveryAddress
      );
      return;
    }

    await placeCodOrder(deliveryAddress);
  };

  if (completedOrder) {
    const isRazorpay =
      completedOrder.paymentMethod ===
      "razorpay";

    return (
      <main className="checkout-page">
        <section className="order-success-card">
          <div className="success-icon">
            <CheckCircle2 size={74} />
          </div>

          <p className="eyebrow">
            Order confirmed
          </p>

          <h1>
            Your pizza is being prepared!
          </h1>

          <p>
            {isRazorpay
              ? "Your online payment was verified and your order was successfully placed."
              : "Your Cash-on-Delivery order was successfully placed."}
          </p>

          <div className="success-order-details">
            <div>
              <span>Order number</span>

              <strong>
                {completedOrder.orderNumber}
              </strong>
            </div>

            <div>
              <span>Total amount</span>

              <strong>
                ₹{completedOrder.totalAmount}
              </strong>
            </div>

            <div>
              <span>Payment</span>

              <strong>
                {isRazorpay
                  ? "Paid with Razorpay"
                  : "Cash on Delivery"}
              </strong>
            </div>

            <div>
              <span>Payment status</span>

              <strong>
                {completedOrder.paymentStatus}
              </strong>
            </div>

            <div>
              <span>Order status</span>

              <strong>
                {completedOrder.orderStatus}
              </strong>
            </div>
          </div>

          <div className="checkout-success-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate("/my-orders")
              }
            >
              <ShoppingBag size={19} />
              View My Orders
            </button>

            <button
              type="button"
              className="outline-button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              <Home size={19} />
              Dashboard
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="checkout-page">
        <nav className="checkout-nav">
          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <ArrowLeft size={19} />
            Dashboard
          </button>

          <h2>🍕 Pizza Delivery</h2>
        </nav>

        <section className="empty-cart">
          <ShoppingBag size={65} />

          <h2>Your cart is empty</h2>

          <p>
            Add a pizza before opening
            checkout.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Browse Pizzas
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <nav className="checkout-nav">
        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate("/cart")
          }
        >
          <ArrowLeft size={19} />
          Back to Cart
        </button>

        <h2>🍕 Pizza Delivery</h2>

        <div className="builder-price">
          Total:{" "}
          <strong>₹{totalAmount}</strong>
        </div>
      </nav>

      <section className="checkout-header">
        <p className="eyebrow">
          Complete your order
        </p>

        <h1>Delivery Details</h1>

        <p>
          Enter the address where you want
          your pizza delivered.
        </p>
      </section>

      <form
        className="checkout-layout"
        onSubmit={placeOrder}
      >
        <section className="checkout-form-card">
          <div className="checkout-section-title">
            <Truck size={25} />

            <div>
              <h2>Delivery Address</h2>

              <p>
                Please provide accurate
                delivery information.
              </p>
            </div>
          </div>

          <div className="checkout-form-grid">
            <label className="checkout-field">
              <span>Full name</span>

              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </label>

            <label className="checkout-field">
              <span>Phone number</span>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                required
              />
            </label>

            <label className="checkout-field full-width">
              <span>Address</span>

              <input
                type="text"
                name="addressLine"
                value={formData.addressLine}
                onChange={handleChange}
                placeholder="House number, street and locality"
                required
              />
            </label>

            <label className="checkout-field">
              <span>City</span>

              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
                required
              />
            </label>

            <label className="checkout-field">
              <span>State</span>

              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Enter state"
                required
              />
            </label>

            <label className="checkout-field">
              <span>Postal code</span>

              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="Enter postal code"
                required
              />
            </label>
          </div>

          <div className="payment-selection">
            <div className="checkout-section-title">
              <CreditCard size={25} />

              <div>
                <h2>Payment Method</h2>

                <p>
                  Select how you want to pay.
                </p>
              </div>
            </div>

            <div className="payment-options">
              <button
                type="button"
                className={`payment-method-card ${
                  paymentMethod === "cod"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setPaymentMethod("cod")
                }
              >
                <span className="payment-radio">
                  <span />
                </span>

                <Banknote size={28} />

                <div>
                  <strong>
                    Cash on Delivery
                  </strong>

                  <p>
                    Pay when your pizza arrives.
                  </p>
                </div>
              </button>

              <button
                type="button"
                className={`payment-method-card ${
                  paymentMethod === "razorpay"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setPaymentMethod("razorpay")
                }
              >
                <span className="payment-radio">
                  <span />
                </span>

                <CreditCard size={28} />

                <div>
                  <strong>
                    Pay Online
                  </strong>

                  <p>
                    Secure payment using
                    Razorpay Test Mode.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </section>

        <aside className="order-summary">
          <h2>Order Summary</h2>

          <div className="checkout-items">
            {cart.map((item, index) => (
              <div
                className="checkout-item"
                key={
                  item.cartItemId ||
                  item.pizzaId ||
                  `${item.name}-${index}`
                }
              >
                <span>
                  {item.quantity} ×{" "}
                  {item.name}
                </span>

                <strong>
                  ₹
                  {Number(item.price || 0) *
                    Number(
                      item.quantity || 1
                    )}
                </strong>
              </div>
            ))}
          </div>

          <div className="summary-price-row">
            <span>Subtotal</span>
            <strong>₹{subtotal}</strong>
          </div>

          <div className="summary-price-row">
            <span>Delivery fee</span>
            <strong>₹{deliveryFee}</strong>
          </div>

          <div className="summary-price-row total-row">
            <span>Total</span>
            <strong>₹{totalAmount}</strong>
          </div>

          <button
            type="submit"
            className="primary-button checkout-button"
            disabled={placingOrder}
          >
            {placingOrder
              ? paymentMethod === "razorpay"
                ? "Opening Razorpay..."
                : "Placing Order..."
              : paymentMethod === "razorpay"
                ? `Pay ₹${totalAmount} Online`
                : "Place Cash-on-Delivery Order"}
          </button>

          {paymentMethod === "razorpay" && (
            <p className="payment-security-note">
              Razorpay Test Mode — no real
              money will be charged.
            </p>
          )}
        </aside>
      </form>
    </main>
  );
}