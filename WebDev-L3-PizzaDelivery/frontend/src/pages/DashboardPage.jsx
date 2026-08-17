import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ChefHat,
  LogOut,
  PackageOpen,
  Search,
  ShoppingCart,
  Star,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { getMenuImage } from "../utils/menuImages";

const menuTabs = [
  { value: "all", label: "All" },
  { value: "pizza", label: "Pizzas" },
  { value: "starter", label: "Starters" },
  { value: "drink", label: "Cold Drinks" },
];

const sectionLabel = {
  pizza: "Pizza",
  starter: "Starter",
  drink: "Cold Drink",
};

function MenuArtwork({ item }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getMenuImage(item);

  if (!imageUrl || imageFailed) {
    return (
      <div className="pizza-image-fallback" aria-hidden="true">
        {item.emoji || "🍕"}
      </div>
    );
  }

  return (
    <img
      className="pizza-image"
      src={imageUrl}
      alt={item.name}
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartCount, setCartCount] = useState(() => {
    const savedCart = JSON.parse(
      localStorage.getItem("pizzaCart") || "[]"
    );

    return savedCart.reduce(
      (total, item) => total + Number(item.quantity || 1),
      0
    );
  });

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const response = await api.get("/catalog/pizzas");
        const loadedItems = response.data.pizzas || [];
        setMenuItems(loadedItems);

        const savedCart = JSON.parse(
          localStorage.getItem("pizzaCart") || "[]"
        );
        const menuByName = new Map(
          loadedItems.map((item) => [item.name, item])
        );
        const migratedCart = (Array.isArray(savedCart) ? savedCart : [])
          .map((cartItem) => {
            if (cartItem.itemType === "custom") return cartItem;

            const currentItem = menuByName.get(cartItem.name);
            if (!currentItem) return null;

            return {
              ...cartItem,
              pizzaId: currentItem._id,
              price: currentItem.price,
              image: getMenuImage(currentItem),
              emoji: currentItem.emoji,
              menuSection: currentItem.menuSection || "pizza",
            };
          })
          .filter(Boolean);

        localStorage.setItem("pizzaCart", JSON.stringify(migratedCart));
        setCartCount(
          migratedCart.reduce(
            (total, item) => total + Number(item.quantity || 1),
            0
          )
        );
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Unable to load the menu"
        );
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesSection =
        activeSection === "all" || item.menuSection === activeSection;
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch);

      return matchesSection && matchesSearch;
    });
  }, [activeSection, menuItems, searchTerm]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const addToCart = (item) => {
    const cart = JSON.parse(
      localStorage.getItem("pizzaCart") || "[]"
    );

    const existingItem = cart.find(
      (cartItem) => cartItem.pizzaId === item._id
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        itemType: "catalogue",
        pizzaId: item._id,
        name: item.name,
        price: item.price,
        image: getMenuImage(item),
        emoji: item.emoji,
        menuSection: item.menuSection || "pizza",
        quantity: 1,
      });
    }

    localStorage.setItem("pizzaCart", JSON.stringify(cart));
    setCartCount(
      cart.reduce(
        (total, cartItem) => total + Number(cartItem.quantity || 1),
        0
      )
    );
    toast.success(`${item.name} added to cart`);
  };

  return (
    <main className="dashboard">
      <nav className="dashboard-nav">
        <h2>🍕 Pizza Delivery</h2>

        <div className="nav-actions">
          <button
            className="cart-button"
            onClick={() => navigate("/my-orders")}
          >
            <PackageOpen size={19} />
            My Orders
          </button>

          <button className="cart-button" onClick={() => navigate("/cart")}>
            <ShoppingCart size={19} />
            Cart
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>

          <button className="outline-button" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>

      <section className="welcome-panel">
        <p className="eyebrow">Customer Dashboard</p>
        <h1>Welcome, {user?.name || "Customer"}!</h1>
        <p>
          Order pizzas, starters and refreshing drinks, or build your own
          favourite pizza.
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
            <h2>Explore Our Menu</h2>
          </div>
          <p>{menuItems.length} items available</p>
        </div>

        <div className="menu-toolbar">
          <div className="menu-tabs" role="tablist" aria-label="Menu sections">
            {menuTabs.map((tab) => (
              <button
                type="button"
                className={activeSection === tab.value ? "active" : ""}
                key={tab.value}
                onClick={() => setActiveSection(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label className="menu-search">
            <Search size={18} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search the menu"
            />
          </label>
        </div>

        {loading ? (
          <div className="catalogue-message">Loading the menu...</div>
        ) : filteredItems.length === 0 ? (
          <div className="catalogue-message">
            No matching menu items were found.
          </div>
        ) : (
          <div className="pizza-grid">
            {filteredItems.map((item) => (
              <article className="pizza-card" key={item._id}>
                <div className="pizza-image-shell">
                  {item.isFeatured && (
                    <span className="featured-badge">
                      <Star size={14} fill="currentColor" />
                      Popular
                    </span>
                  )}
                  <MenuArtwork item={item} />
                </div>

                <div className="pizza-details">
                  <div className="menu-card-labels">
                    <span className={`food-type ${item.category}`}>
                      {item.category === "vegetarian" ? "Veg" : "Non-Veg"}
                    </span>
                    <span className={`menu-section-badge ${item.menuSection}`}>
                      {sectionLabel[item.menuSection] || "Pizza"}
                    </span>
                  </div>

                  <h3>{item.name}</h3>
                  <p>{item.description}</p>

                  <div className="pizza-card-footer">
                    <strong>₹{item.price}</strong>
                    <button
                      className="small-primary-button"
                      onClick={() => addToCart(item)}
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
