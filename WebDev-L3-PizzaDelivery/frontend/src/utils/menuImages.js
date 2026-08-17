export const menuImages = {
  "Margherita Classic": "/menu/margherita-classic.webp",
  "Farmhouse Feast": "/menu/farmhouse-feast.webp",
  "Paneer Tikka Pizza": "/menu/paneer-tikka-pizza.webp",
  "Veggie Supreme": "/menu/veggie-supreme.webp",
  "Corn and Cheese": "/menu/corn-and-cheese.webp",
  "Spicy Chicken Pizza": "/menu/spicy-chicken-pizza.webp",
  "Mushroom Cheese Melt": "/menu/mushroom-cheese-melt.webp",
  "Tandoori Paneer Blaze": "/menu/tandoori-paneer-blaze.webp",
  "BBQ Chicken Supreme": "/menu/bbq-chicken-supreme.webp",
  "Chicken Pepperoni": "/menu/chicken-pepperoni.webp",
  "Classic Garlic Bread": "/menu/classic-garlic-bread.webp",
  "Cheesy Garlic Bread": "/menu/cheesy-garlic-bread.webp",
  "Paneer Tikka Bites": "/menu/paneer-tikka-bites.webp",
  "Veg Nuggets": "/menu/veg-nuggets.webp",
  "Crispy Chicken Wings": "/menu/crispy-chicken-wings.webp",
  "Chicken Nuggets": "/menu/chicken-nuggets.webp",
  Cola: "/menu/cola.webp",
  "Lemon-Lime Soda": "/menu/lemon-lime-soda.webp",
  "Orange Fizz": "/menu/orange-fizz.webp",
  "Iced Tea": "/menu/iced-tea.webp",
  "Mineral Water": "/menu/mineral-water.webp",
  "My Custom Pizza": "/menu/custom-pizza.webp",
};

export const getMenuImage = (item) =>
  item?.image || menuImages[item?.name] || "";

export const getMenuSectionLabel = (item) => {
  if (item?.itemType === "custom") return "Custom Pizza";
  if (item?.menuSection === "starter") return "Starter";
  if (item?.menuSection === "drink") return "Cold Drink";
  return "Menu Pizza";
};
