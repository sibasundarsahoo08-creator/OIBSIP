import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ChefHat,
  LogOut,
  ShoppingCart,
  Star,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(() => {
    const savedCart = JSON.parse(
      localStorage.getItem("pizzaCart") || "[]"
    );

    return savedCart.reduce(
      (total, item) => total + item.quantity,
      0
    );
  });

  useEffect(() => {
    const loadPizzas = async () => {
      try {
        const response = await api.get("/catalog/pizzas");
        setPizzas(response.data.pizzas);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
          "Unable to load pizza catalogue"
        );
      } finally {
        setLoading(false);
      }
    };

    loadPizzas();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const addToCart = (pizza) => {
    const cart = JSON.parse(
      localStorage.getItem("pizzaCart") || "[]"
    );

    const existingItem = cart.find(
      (item) => item.pizzaId === pizza._id
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        itemType: "catalogue",
        pizzaId: pizza._id,
        name: pizza.name,
        price: pizza.price,
        emoji: pizza.emoji,
        quantity: 1,
      });
    }

    localStorage.setItem("pizzaCart", JSON.stringify(cart));

    setCartCount(
      cart.reduce(
        (total, item) => total + item.quantity,
        0
      )
    );

    toast.success(`${pizza.name} added to cart`);
  };

  return (
    <main className="dashboard">
      <nav className="dashboard-nav">
        <h2>🍕 Pizza Delivery</h2>

        <div className="nav-actions">
          <button className="cart-button"
          onClick={() => navigate("/cart")}
>
            <ShoppingCart size={19} />
            Cart
            {cartCount > 0 && (
              <span className="cart-count">{cartCount}</span>
            )}
          </button>

          <button
            className="outline-button"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>

      <section className="welcome-panel">
        <p className="eyebrow">Customer Dashboard</p>
        <h1>Welcome, {user?.name}!</h1>
        <p>
          Choose one of our popular pizzas or create your own
          pizza exactly the way you like it.
        </p>

        <button
          className="builder-button"
          onClick={() => navigate("/pizza-builder")}
        >
          <ChefHat size={20} />
          Build Your Own Pizza
        </button>
      </section>

      <section className="catalogue-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Freshly prepared</p>
            <h2>Our Pizza Menu</h2>
          </div>

          <p>{pizzas.length} varieties available</p>
        </div>

        {loading ? (
          <div className="catalogue-message">
            Loading delicious pizzas...
          </div>
        ) : pizzas.length === 0 ? (
          <div className="catalogue-message">
            No pizzas are currently available. Run the catalogue
            seed command in the backend.
          </div>
        ) : (
          <div className="pizza-grid">
            {pizzas.map((pizza) => (
              <article className="pizza-card" key={pizza._id}>
                {pizza.isFeatured && (
                  <span className="featured-badge">
                    <Star size={14} fill="currentColor" />
                    Popular
                  </span>
                )}

                <div className="pizza-emoji">
                  {pizza.emoji || "🍕"}
                </div>

                <div className="pizza-details">
                  <span
                    className={`food-type ${pizza.category}`}
                  >
                    {pizza.category === "vegetarian"
                      ? "Veg"
                      : "Non-Veg"}
                  </span>

                  <h3>{pizza.name}</h3>
                  <p>{pizza.description}</p>

                  <div className="pizza-card-footer">
                    <strong>₹{pizza.price}</strong>

                    <button
                      className="small-primary-button"
                      onClick={() => addToCart(pizza)}
                    >
                      <ShoppingCart size={17} />
                      Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}