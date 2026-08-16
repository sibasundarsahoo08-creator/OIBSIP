import {
    useCallback,
    useEffect,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    BarChart3,
    Boxes,
    ClipboardList,
    LogOut,
    PackageCheck,
    Pizza,
    RefreshCw,
    Save,
    TriangleAlert,
    Users,
    WalletCards,
} from "lucide-react";

import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const statusLabels = {
    placed: "Placed",
    confirmed: "Confirmed",
    preparing: "Preparing",
    "out-for-delivery": "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

const normalStatuses = [
    "placed",
    "confirmed",
    "preparing",
    "out-for-delivery",
    "delivered",
];

const getAvailableStatuses = (currentStatus) => {
    if (
        currentStatus === "delivered" ||
        currentStatus === "cancelled"
    ) {
        return [currentStatus];
    }

    const currentIndex =
        normalStatuses.indexOf(currentStatus);

    return [
        currentStatus,
        ...normalStatuses.slice(currentIndex + 1),
        "cancelled",
    ];
};

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [activeTab, setActiveTab] =
        useState("overview");
    const [dashboard, setDashboard] = useState({
        stats: {},
        recentOrders: [],
    });
    const [inventory, setInventory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);
    const [savingIngredient, setSavingIngredient] =
        useState(null);
    const [updatingOrder, setUpdatingOrder] =
        useState(null);

    const loadAdminData = useCallback(
        async (showMessage = false) => {
            try {
                const [
                    dashboardResponse,
                    inventoryResponse,
                    ordersResponse,
                ] = await Promise.all([
                    api.get("/admin/dashboard"),
                    api.get("/admin/inventory"),
                    api.get("/admin/orders"),
                ]);

                setDashboard({
                    stats: dashboardResponse.data.stats || {},
                    recentOrders:
                        dashboardResponse.data.recentOrders || [],
                });

                setInventory(
                    inventoryResponse.data.ingredients || []
                );

                setOrders(
                    ordersResponse.data.orders || []
                );

                if (showMessage) {
                    toast.success("Admin data refreshed");
                }
            } catch (error) {
                toast.error(
                    error.response?.data?.message ||
                    "Unable to load admin dashboard"
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        if (!user) {
            return;
        }

        if (user.role !== "admin") {
            toast.error("Admin access required");
            navigate("/dashboard", {
                replace: true,
            });
            return;
        }

        loadAdminData();
    }, [user, navigate, loadAdminData]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const refreshData = () => {
        setRefreshing(true);
        loadAdminData(true);
    };

    const changeIngredientField = (
        ingredientId,
        field,
        value
    ) => {
        setInventory((previous) =>
            previous.map((ingredient) =>
                ingredient._id === ingredientId
                    ? {
                        ...ingredient,
                        [field]: value,
                    }
                    : ingredient
            )
        );
    };

    const saveIngredient = async (ingredient) => {
        setSavingIngredient(ingredient._id);

        try {
            const response = await api.patch(
                `/admin/inventory/${ingredient._id}`,
                {
                    stock: Number(ingredient.stock),
                    price: Number(ingredient.price),
                    lowStockThreshold: Number(
                        ingredient.lowStockThreshold
                    ),
                    isAvailable: Boolean(
                        ingredient.isAvailable
                    ),
                }
            );

            setInventory((previous) =>
                previous.map((item) =>
                    item._id === ingredient._id
                        ? response.data.ingredient
                        : item
                )
            );

            toast.success(
                `${ingredient.name} updated`
            );

            await loadAdminData();
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Unable to update ingredient"
            );
        } finally {
            setSavingIngredient(null);
        }
    };

    const updateOrderStatus = async (
        orderId,
        orderStatus
    ) => {
        setUpdatingOrder(orderId);

        try {
            const response = await api.patch(
                `/admin/orders/${orderId}/status`,
                {
                    orderStatus,
                }
            );

            setOrders((previous) =>
                previous.map((order) =>
                    order._id === orderId
                        ? response.data.order
                        : order
                )
            );

            toast.success(
                `Order changed to ${statusLabels[orderStatus]
                }`
            );

            await loadAdminData();
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Unable to update order"
            );
        } finally {
            setUpdatingOrder(null);
        }
    };

    if (loading) {
        return (
            <div className="page-loader">
                Loading admin dashboard...
            </div>
        );
    }

    const stats = dashboard.stats || {};

    const statCards = [
        {
            label: "Customers",
            value: stats.totalUsers || 0,
            icon: Users,
        },
        {
            label: "Total Orders",
            value: stats.totalOrders || 0,
            icon: ClipboardList,
        },
        {
            label: "Pending Orders",
            value: stats.pendingOrders || 0,
            icon: PackageCheck,
        },
        {
            label: "Order Value",
            value: `₹${stats.totalOrderValue || 0}`,
            icon: WalletCards,
        },
        {
            label: "Ingredients",
            value: stats.ingredientCount || 0,
            icon: Boxes,
        },
        {
            label: "Low Stock",
            value: stats.lowStockIngredients || 0,
            icon: TriangleAlert,
        },
    ];

    return (
        <main className="admin-page">
            <nav className="admin-nav">
                <div>
                    <p className="eyebrow">
                        Management Portal
                    </p>
                    <h2>🍕 Pizza Delivery Admin</h2>
                </div>

                <div className="admin-nav-actions">
                    <button
                        type="button"
                        className="outline-button"
                        onClick={refreshData}
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={17}
                            className={
                                refreshing ? "spinning" : ""
                            }
                        />
                        Refresh
                    </button>

                    <button
                        type="button"
                        className="outline-button"
                        onClick={handleLogout}
                    >
                        <LogOut size={17} />
                        Logout
                    </button>
                </div>
            </nav>

            <section className="admin-welcome">
                <div>
                    <p className="eyebrow">
                        Administrator
                    </p>
                    <h1>Welcome, {user?.name}</h1>
                    <p>
                        Manage customer orders and pizza
                        ingredients from one dashboard.
                    </p>
                </div>

                <Pizza size={70} />
            </section>

            <section className="admin-tabs">
                <button
                    type="button"
                    className={
                        activeTab === "overview"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab("overview")
                    }
                >
                    <BarChart3 size={18} />
                    Overview
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "inventory"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab("inventory")
                    }
                >
                    <Boxes size={18} />
                    Inventory
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "orders"
                            ? "active"
                            : ""
                    }
                    onClick={() => setActiveTab("orders")}
                >
                    <ClipboardList size={18} />
                    Orders
                </button>
            </section>

            {activeTab === "overview" && (
                <>
                    <section className="admin-stat-grid">
                        {statCards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <article
                                    className="admin-stat-card"
                                    key={card.label}
                                >
                                    <span>
                                        <Icon size={23} />
                                    </span>

                                    <div>
                                        <p>{card.label}</p>
                                        <strong>{card.value}</strong>
                                    </div>
                                </article>
                            );
                        })}
                    </section>

                    <section className="admin-panel">
                        <div className="admin-panel-heading">
                            <div>
                                <p className="eyebrow">
                                    Latest activity
                                </p>
                                <h2>Recent Orders</h2>
                            </div>

                            <button
                                type="button"
                                className="small-primary-button"
                                onClick={() =>
                                    setActiveTab("orders")
                                }
                            >
                                View All
                            </button>
                        </div>

                        {dashboard.recentOrders.length ===
                            0 ? (
                            <p className="admin-empty">
                                No orders have been placed yet.
                            </p>
                        ) : (
                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Order</th>
                                            <th>Customer</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {dashboard.recentOrders.map(
                                            (order) => (
                                                <tr key={order._id}>
                                                    <td>
                                                        <strong>
                                                            {order.orderNumber}
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        {order.user?.name ||
                                                            "Customer"}
                                                    </td>

                                                    <td>
                                                        ₹{order.totalAmount}
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`order-status status-${order.orderStatus}`}
                                                        >
                                                            {
                                                                statusLabels[
                                                                order.orderStatus
                                                                ]
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {new Date(
                                                            order.createdAt
                                                        ).toLocaleDateString(
                                                            "en-IN"
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}

            {activeTab === "inventory" && (
                <section className="admin-panel">
                    <div className="admin-panel-heading">
                        <div>
                            <p className="eyebrow">
                                Stock management
                            </p>
                            <h2>Ingredient Inventory</h2>
                        </div>

                        <p>
                            {inventory.length} ingredients
                        </p>
                    </div>

                    <div className="admin-table-wrapper">
                        <table className="admin-table inventory-table">
                            <thead>
                                <tr>
                                    <th>Ingredient</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Low-stock level</th>
                                    <th>Available</th>
                                    <th>Save</th>
                                </tr>
                            </thead>

                            <tbody>
                                {inventory.map((ingredient) => {
                                    const isLowStock =
                                        Number(ingredient.stock) <=
                                        Number(
                                            ingredient.lowStockThreshold
                                        );

                                    return (
                                        <tr
                                            key={ingredient._id}
                                            className={
                                                isLowStock
                                                    ? "low-stock-row"
                                                    : ""
                                            }
                                        >
                                            <td>
                                                <strong>
                                                    {ingredient.name}
                                                </strong>

                                                {isLowStock && (
                                                    <span className="low-stock-label">
                                                        Low stock
                                                    </span>
                                                )}
                                            </td>

                                            <td className="capitalize">
                                                {ingredient.category}
                                            </td>

                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={ingredient.price}
                                                    onChange={(event) =>
                                                        changeIngredientField(
                                                            ingredient._id,
                                                            "price",
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={ingredient.stock}
                                                    onChange={(event) =>
                                                        changeIngredientField(
                                                            ingredient._id,
                                                            "stock",
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={
                                                        ingredient.lowStockThreshold
                                                    }
                                                    onChange={(event) =>
                                                        changeIngredientField(
                                                            ingredient._id,
                                                            "lowStockThreshold",
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        ingredient.isAvailable
                                                    }
                                                    onChange={(event) =>
                                                        changeIngredientField(
                                                            ingredient._id,
                                                            "isAvailable",
                                                            event.target.checked
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="save-admin-button"
                                                    onClick={() =>
                                                        saveIngredient(
                                                            ingredient
                                                        )
                                                    }
                                                    disabled={
                                                        savingIngredient ===
                                                        ingredient._id
                                                    }
                                                >
                                                    <Save size={16} />

                                                    {savingIngredient ===
                                                        ingredient._id
                                                        ? "Saving"
                                                        : "Save"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {activeTab === "orders" && (
                <section className="admin-panel">
                    <div className="admin-panel-heading">
                        <div>
                            <p className="eyebrow">
                                Customer orders
                            </p>
                            <h2>Order Management</h2>
                        </div>

                        <p>{orders.length} orders</p>
                    </div>

                    {orders.length === 0 ? (
                        <p className="admin-empty">
                            No customer orders found.
                        </p>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Customer</th>
                                        <th>Items</th>
                                        <th>Total</th>
                                        <th>Payment</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order._id}>
                                            <td>
                                                <strong>
                                                    {order.orderNumber}
                                                </strong>

                                                <small>
                                                    {new Date(
                                                        order.createdAt
                                                    ).toLocaleDateString(
                                                        "en-IN"
                                                    )}
                                                </small>
                                            </td>

                                            <td>
                                                <strong>
                                                    {order.user?.name ||
                                                        "Customer"}
                                                </strong>

                                                <small>
                                                    {order.user?.email}
                                                </small>
                                            </td>

                                            <td>
                                                {order.items.reduce(
                                                    (total, item) =>
                                                        total +
                                                        Number(item.quantity),
                                                    0
                                                )}
                                            </td>

                                            <td>
                                                <strong>
                                                    ₹{order.totalAmount}
                                                </strong>
                                            </td>

                                            <td>
                                                {order.paymentMethod ===
                                                    "cod"
                                                    ? "COD"
                                                    : "Online"}
                                            </td>

                                            <td>
                                                <select
                                                    value={order.orderStatus}
                                                    disabled={
                                                        updatingOrder ===
                                                        order._id ||
                                                        order.orderStatus ===
                                                        "delivered" ||
                                                        order.orderStatus ===
                                                        "cancelled"
                                                    }
                                                    onChange={(event) =>
                                                        updateOrderStatus(
                                                            order._id,
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    {getAvailableStatuses(
                                                        order.orderStatus
                                                    ).map((status) => (
                                                        <option
                                                            value={status}
                                                            key={status}
                                                        >
                                                            {
                                                                statusLabels[
                                                                status
                                                                ]
                                                            }
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}
        </main>
    );
}