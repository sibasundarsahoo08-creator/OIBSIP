import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import { getMenuImage, getMenuSectionLabel } from "../utils/menuImages";

const loadSavedCart = () => {
  try {
    const savedCart = JSON.parse(
      localStorage.getItem("pizzaCart") || "[]"
    );
    return Array.isArray(savedCart) ? savedCart : [];
  } catch {
    return [];
  }
};

function CartItemImage({ item }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getMenuImage(item);

  if (!imageUrl || imageFailed) {
    return <div className="cart-image-fallback">{item.emoji || "🍕"}</div>;
  }

  return (
    <img
      className="cart-product-image"
      src={imageUrl}
      alt={item.name}
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(loadSavedCart);

  const saveCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("pizzaCart", JSON.stringify(updatedCart));
  };

  const changeQuantity = (itemIndex, change) => {
    saveCart(
      cart.map((item, index) =>
        index === itemIndex
          ? {
              ...item,
              quantity: Math.max(
                1,
                Number(item.quantity || 1) + change
              ),
            }
          : item
      )
    );
  };

  const removeItem = (itemIndex) => {
    const removedItem = cart[itemIndex];
    saveCart(cart.filter((_, index) => index !== itemIndex));
    toast.success(`${removedItem?.name || "Item"} removed from cart`);
  };

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + Number(item.price || 0) * Number(item.quantity || 1),
        0
      ),
    [cart]
  );

  const totalItems = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + Number(item.quantity || 1),
        0
      ),
    [cart]
  );

  const deliveryFee = subtotal > 0 ? 40 : 0;
  const totalPrice = subtotal + deliveryFee;

  const handleCheckout = () => {
    if (!cart.length) {
      toast.error("Your cart is empty");
      return;
    }
    navigate("/checkout");
  };

  if (!cart.length) {
    return (
      <main className="cart-page">
        <nav className="cart-nav">
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={19} />
            Dashboard
          </button>
          <h2>🍕 Pizza Delivery</h2>
          <div className="builder-price">Cart: <strong>0</strong></div>
        </nav>

        <section className="empty-cart">
          <ShoppingBag size={65} />
          <h2>Your cart is empty</h2>
          <p>Add pizzas, starters or cold drinks from our menu.</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/dashboard")}
          >
            <ShoppingCart size={19} />
            Browse Menu
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <nav className="cart-nav">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={19} />
          Dashboard
        </button>
        <h2>🍕 Pizza Delivery</h2>
        <div className="builder-price">Cart: <strong>{totalItems}</strong></div>
      </nav>

      <section className="cart-header">
        <p className="eyebrow">Your order</p>
        <h1>Shopping Cart</h1>
        <p>Review your menu items before proceeding to checkout.</p>
      </section>

      <section className="cart-layout">
        <div className="cart-items">
          {cart.map((item, index) => {
            const quantity = Number(item.quantity || 1);
            const itemTotal = Number(item.price || 0) * quantity;

            return (
              <article
                className="cart-item"
                key={item.cartItemId || item.pizzaId || `${item.name}-${index}`}
              >
                <div className="cart-item-emoji cart-item-image-wrap">
                  <CartItemImage item={item} />
                </div>

                <div className="cart-item-info">
                  <span className="cart-item-type">
                    {getMenuSectionLabel(item)}
                  </span>
                  <h3>{item.name}</h3>

                  {item.itemType === "custom" && item.customPizza && (
                    <div className="custom-details">
                      <p><strong>Base:</strong> {item.customPizza.base?.name}</p>
                      <p><strong>Sauce:</strong> {item.customPizza.sauce?.name}</p>
                      <p><strong>Cheese:</strong> {item.customPizza.cheese?.name}</p>
                      <p>
                        <strong>Vegetables:</strong>{" "}
                        {item.customPizza.vegetables?.length
                          ? item.customPizza.vegetables
                              .map((vegetable) => vegetable.name)
                              .join(", ")
                          : "None"}
                      </p>
                    </div>
                  )}

                  <strong className="cart-item-price">₹{item.price} each</strong>
                </div>

                <div className="cart-item-actions">
                  <strong>₹{itemTotal}</strong>
                  <div className="quantity-control">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => changeQuantity(index, -1)}
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span>{quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => changeQuantity(index, 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="remove-button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-price-row">
            <span>
              Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})
            </span>
            <strong>₹{subtotal}</strong>
          </div>
          <div className="summary-price-row">
            <span>Delivery fee</span>
            <strong>₹{deliveryFee}</strong>
          </div>
          <div className="summary-price-row total-row">
            <span>Total</span>
            <strong>₹{totalPrice}</strong>
          </div>
          <button
            type="button"
            className="primary-button checkout-button"
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </button>
          <p className="payment-note">Secure checkout and online payment are available.</p>
        </aside>
      </section>
    </main>
  );
}
