import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Check,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";

import api from "../api/api";

const steps = [
  "Choose Base",
  "Choose Sauce",
  "Choose Cheese",
  "Add Vegetables",
];

export default function PizzaBuilderPage() {
  const navigate = useNavigate();

  const [options, setOptions] = useState({
    bases: [],
    sauces: [],
    cheeses: [],
    vegetables: [],
  });

  const [selection, setSelection] = useState({
    base: null,
    sauce: null,
    cheese: null,
    vegetables: [],
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await api.get(
          "/catalog/builder-options"
        );

        setOptions(response.data.options);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Unable to load pizza options"
        );
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  const totalPrice = useMemo(() => {
    const basePrice = selection.base?.price || 0;
    const saucePrice = selection.sauce?.price || 0;
    const cheesePrice = selection.cheese?.price || 0;

    const vegetablePrice = selection.vegetables.reduce(
      (total, vegetable) => total + vegetable.price,
      0
    );

    return (
      basePrice +
      saucePrice +
      cheesePrice +
      vegetablePrice
    );
  }, [selection]);

  const selectSingleOption = (field, item) => {
    setSelection((previous) => ({
      ...previous,
      [field]: item,
    }));
  };

  const toggleVegetable = (vegetable) => {
    setSelection((previous) => {
      const alreadySelected = previous.vegetables.some(
        (item) => item._id === vegetable._id
      );

      return {
        
        ...previous,
        vegetables: alreadySelected
          ? previous.vegetables.filter(
              (item) => item._id !== vegetable._id
            )
          : [...previous.vegetables, vegetable],
      };
    });
  };
  const goToStep = (stepIndex) => {
  if (stepIndex >= 1 && !selection.base) {
    toast.error("Please choose a pizza base first");
    return;
  }

  if (stepIndex >= 2 && !selection.sauce) {
    toast.error("Please choose a sauce first");
    return;
  }

  if (stepIndex >= 3 && !selection.cheese) {
    toast.error("Please choose a cheese first");
    return;
  }

  setCurrentStep(stepIndex);
};

  const canContinue = () => {
    if (currentStep === 0) return Boolean(selection.base);
    if (currentStep === 1) return Boolean(selection.sauce);
    if (currentStep === 2) return Boolean(selection.cheese);

    return true;
  };

  const nextStep = () => {
    if (!canContinue()) {
      toast.error(`Please select a ${steps[currentStep]}`);
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, 3));
  };

  const previousStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const addCustomPizzaToCart = () => {
    if (
      !selection.base ||
      !selection.sauce ||
      !selection.cheese
    ) {
      toast.error("Complete all required pizza selections");
      return;
    }

    const cart = JSON.parse(
      localStorage.getItem("pizzaCart") || "[]"
    );

    cart.push({
      cartItemId: `custom-${Date.now()}`,
      itemType: "custom",
      name: "My Custom Pizza",
      emoji: "🍕",
      quantity: 1,
      price: totalPrice,
      customPizza: {
        base: {
          ingredientId: selection.base._id,
          name: selection.base.name,
          price: selection.base.price,
        },
        sauce: {
          ingredientId: selection.sauce._id,
          name: selection.sauce.name,
          price: selection.sauce.price,
        },
        cheese: {
          ingredientId: selection.cheese._id,
          name: selection.cheese.name,
          price: selection.cheese.price,
        },
        vegetables: selection.vegetables.map((item) => ({
          ingredientId: item._id,
          name: item.name,
          price: item.price,
        })),
      },
    });

    localStorage.setItem("pizzaCart", JSON.stringify(cart));

    toast.success("Custom pizza added to cart");
    navigate("/dashboard");
  };

  const renderOption = (item, field) => {
    const selected =
      field === "vegetables"
        ? selection.vegetables.some(
            (vegetable) => vegetable._id === item._id
          )
        : selection[field]?._id === item._id;

    const chooseItem = () => {
      if (field === "vegetables") {
        toggleVegetable(item);
      } else {
        selectSingleOption(field, item);
      }
    };

    return (
      <button
        type="button"
        className={`ingredient-option ${
          selected ? "selected" : ""
        }`}
        key={item._id}
        onClick={chooseItem}
      >
        <span className="selection-check">
          {selected && <Check size={16} />}
        </span>

        <span className="ingredient-icon">
          {field === "base"
            ? "🥖"
            : field === "sauce"
              ? "🥫"
              : field === "cheese"
                ? "🧀"
                : "🥬"}
        </span>

        <strong>{item.name}</strong>
        <small>₹{item.price}</small>
        <span className="stock-text">
          {item.stock} available
        </span>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="page-loader">
        Loading pizza builder...
      </div>
    );
  }

  return (
    <main className="builder-page">
      <nav className="builder-nav">
        <button
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={19} />
          Dashboard
        </button>

        <h2>🍕 Pizza Delivery</h2>

        <div className="builder-price">
          Total: <strong>₹{totalPrice}</strong>
        </div>
      </nav>

      <section className="builder-header">
        <div>
          <p className="eyebrow">Create your favourite</p>
          <h1>Build Your Own Pizza</h1>
          <p>
            Complete all four steps to prepare your perfect
            pizza.
          </p>
        </div>

        <div className="builder-illustration">
          <ChefHat size={70} />
        </div>
      </section>

     <section className="step-progress">
  {steps.map((step, index) => (
    <button
      type="button"
      className={`step-item ${
        index === currentStep ? "active" : ""
      } ${index < currentStep ? "completed" : ""}`}
      key={step}
      onClick={() => goToStep(index)}
    >
      <span>
        {index < currentStep ? (
          <Check size={17} />
        ) : (
          index + 1
        )}
      </span>

      <p>{step}</p>
    </button>
  ))}
</section>

      <section className="builder-content">
        <div className="builder-options">
          {currentStep === 0 && (
            <>
              <h2>Choose your pizza base</h2>
              <p>Select one of our five freshly prepared bases.</p>

              <div className="ingredient-grid">
                {options.bases.map((item) =>
                  renderOption(item, "base")
                )}
              </div>
            </>
          )}

          {currentStep === 1 && (
            <>
              <h2>Choose your sauce</h2>
              <p>Select one sauce for your pizza.</p>

              <div className="ingredient-grid">
                {options.sauces.map((item) =>
                  renderOption(item, "sauce")
                )}
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <h2>Choose your cheese</h2>
              <p>Select your preferred cheese type.</p>

              <div className="ingredient-grid">
                {options.cheeses.map((item) =>
                  renderOption(item, "cheese")
                )}
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h2>Add vegetables</h2>
              <p>
                Choose multiple toppings, or continue without
                vegetables.
              </p>

              <div className="ingredient-grid">
                {options.vegetables.map((item) =>
                  renderOption(item, "vegetables")
                )}
              </div>
            </>
          )}
        </div>

        <aside className="pizza-summary">
          <div className="summary-pizza">🍕</div>
          <h3>Your Pizza</h3>

          <div className="summary-row">
            <span>Base</span>
            <strong>
              {selection.base?.name || "Not selected"}
            </strong>
          </div>

          <div className="summary-row">
            <span>Sauce</span>
            <strong>
              {selection.sauce?.name || "Not selected"}
            </strong>
          </div>

          <div className="summary-row">
            <span>Cheese</span>
            <strong>
              {selection.cheese?.name || "Not selected"}
            </strong>
          </div>

          <div className="summary-row summary-vegetables">
            <span>Vegetables</span>
            <strong>
              {selection.vegetables.length
                ? selection.vegetables
                    .map((item) => item.name)
                    .join(", ")
                : "None"}
            </strong>
          </div>

          <div className="summary-total">
            <span>Total price</span>
            <strong>₹{totalPrice}</strong>
          </div>
        </aside>
      </section>

      <section className="builder-controls">
        <button
          className="outline-button"
          onClick={previousStep}
          disabled={currentStep === 0}
        >
          <ChevronLeft size={19} />
          Previous
        </button>

        {currentStep < 3 ? (
          <button
            className="primary-button"
            onClick={nextStep}
          >
            Continue
            <ChevronRight size={19} />
          </button>
        ) : (
          <button
            className="primary-button"
            onClick={addCustomPizzaToCart}
          >
            <ShoppingCart size={19} />
            Add Custom Pizza
          </button>
        )}
      </section>
    </main>
  );
}