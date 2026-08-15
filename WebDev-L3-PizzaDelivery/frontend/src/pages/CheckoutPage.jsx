import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  ShoppingBag,
  Truck,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const loadCart = () => {
  try {
    const savedCart = JSON.parse(
      localStorage.getItem("pizzaCart") || "[]"
    );

    return Array.isArray(savedCart) ? savedCart : [];
  } catch {
    return [];
  }
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cart] = useState(loadCart);
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

  const deliveryFee = cart.length > 0 ? 40 : 0;
  const totalAmount = subtotal + deliveryFee;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      navigate("/cart");
      return;
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
      (field) => !formData[field].trim()
    );

    if (missingField) {
      toast.error("Please complete the delivery address");
      return;
    }

    if (
      !/^[0-9+\-\s]{10,15}$/.test(
        formData.phone.trim()
      )
    ) {
      toast.error("Enter a valid phone number");
      return;
    }

    if (
      !/^[A-Za-z0-9\-\s]{4,10}$/.test(
        formData.postalCode.trim()
      )
    ) {
      toast.error("Enter a valid postal code");
      return;
    }

    setPlacingOrder(true);

    try {
      const response = await api.post("/orders", {
        items: cart,
        deliveryAddress: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          addressLine:
            formData.addressLine.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode:
            formData.postalCode.trim(),
        },
        paymentMethod: "cod",
      });

      localStorage.removeItem("pizzaCart");

      setCompletedOrder(response.data.order);

      toast.success("Order placed successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to place your order"
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (completedOrder) {
    return (
      <main className="checkout-page">
        <section className="order-success-card">
          <div className="success-icon">
            <CheckCircle2 size={74} />
          </div>

          <p className="eyebrow">
            Order confirmed
          </p>

          <h1>Your pizza is being prepared!</h1>

          <p>
            Your Cash-on-Delivery order has been
            successfully placed.
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
              <strong>Cash on Delivery</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>
                {completedOrder.orderStatus}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/dashboard")}
          >
            <Home size={19} />
            Return to Dashboard
          </button>
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
            onClick={() => navigate("/dashboard")}
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
            Add a pizza before opening checkout.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/dashboard")}
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
          onClick={() => navigate("/cart")}
        >
          <ArrowLeft size={19} />
          Back to Cart
        </button>

        <h2>🍕 Pizza Delivery</h2>

        <div className="builder-price">
          Total: <strong>₹{totalAmount}</strong>
        </div>
      </nav>

      <section className="checkout-header">
        <p className="eyebrow">
          Complete your order
        </p>

        <h1>Delivery Details</h1>

        <p>
          Enter the address where you want your pizza
          delivered.
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
                Please provide accurate delivery
                information.
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

          <div className="payment-method-card">
            <span className="payment-radio">
              <span />
            </span>

            <div>
              <strong>Cash on Delivery</strong>

              <p>
                Pay with cash when your pizza arrives.
              </p>
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
                  {item.quantity} × {item.name}
                </span>

                <strong>
                  ₹
                  {Number(item.price || 0) *
                    Number(item.quantity || 1)}
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
              ? "Placing Order..."
              : "Place Cash-on-Delivery Order"}
          </button>
        </aside>
      </form>
    </main>
  );
}