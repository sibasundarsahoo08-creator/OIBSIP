import {
    useCallback,
    useEffect,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    Clock3,
    MapPin,
    PackageCheck,
    RefreshCw,
    ShoppingBag,
} from "lucide-react";

import api from "../api/api";

const orderSteps = [
    "placed",
    "confirmed",
    "preparing",
    "out-for-delivery",
    "delivered",
];

const statusLabels = {
    placed: "Placed",
    confirmed: "Confirmed",
    preparing: "Preparing",
    "out-for-delivery": "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

export default function MyOrdersPage() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] =
        useState(false);

    const loadOrders = useCallback(
        async (showSuccessMessage = false) => {
            try {
                const response = await api.get(
                    "/orders/my-orders"
                );

                setOrders(response.data.orders || []);

                if (showSuccessMessage) {
                    toast.success("Order status updated");
                }
            } catch (error) {
                toast.error(
                    error.response?.data?.message ||
                    "Unable to load your orders"
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        loadOrders();

        const refreshTimer = setInterval(() => {
            loadOrders(false);
        }, 15000);

        return () => clearInterval(refreshTimer);
    }, [loadOrders]);

    const refreshOrders = () => {
        setRefreshing(true);
        loadOrders(true);
    };

    if (loading) {
        return (
            <div className="page-loader">
                Loading your orders...
            </div>
        );
    }

    return (
        <main className="orders-page">
            <nav className="orders-nav">
                <button
                    type="button"
                    className="back-button"
                    onClick={() => navigate("/dashboard")}
                >
                    <ArrowLeft size={19} />
                    Dashboard
                </button>

                <h2>🍕 Pizza Delivery</h2>

                <button
                    type="button"
                    className="outline-button"
                    onClick={refreshOrders}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={17}
                        className={refreshing ? "spinning" : ""}
                    />

                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </nav>

            <section className="orders-header">
                <p className="eyebrow">Order tracking</p>
                <h1>My Orders</h1>

                <p>
                    View your previous orders and follow their
                    current delivery status.
                </p>
            </section>

            {orders.length === 0 ? (
                <section className="empty-cart">
                    <ShoppingBag size={65} />

                    <h2>No orders found</h2>

                    <p>
                        Your completed orders will appear here.
                    </p>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={() => navigate("/dashboard")}
                    >
                        Order a Pizza
                    </button>
                </section>
            ) : (
                <section className="orders-list">
                    {orders.map((order) => {
                        const currentStatusIndex =
                            orderSteps.indexOf(order.orderStatus);

                        const isCancelled =
                            order.orderStatus === "cancelled";

                        return (
                            <article
                                className="order-card"
                                key={order._id}
                            >
                                <div className="order-card-header">
                                    <div>
                                        <span className="order-number-label">
                                            Order number
                                        </span>

                                        <h2>{order.orderNumber}</h2>
                                    </div>

                                    <span
                                        className={`order-status status-${order.orderStatus}`}
                                    >
                                        {statusLabels[order.orderStatus] ||
                                            order.orderStatus}
                                    </span>
                                </div>

                                {!isCancelled && (
                                    <div className="order-progress">
                                        {orderSteps.map(
                                            (step, stepIndex) => {
                                                const completed =
                                                    stepIndex <=
                                                    currentStatusIndex;

                                                return (
                                                    <div
                                                        className={`order-progress-step ${completed
                                                                ? "completed"
                                                                : ""
                                                            }`}
                                                        key={step}
                                                    >
                                                        <span>
                                                            {completed ? (
                                                                <PackageCheck
                                                                    size={16}
                                                                />
                                                            ) : (
                                                                stepIndex + 1
                                                            )}
                                                        </span>

                                                        <p>
                                                            {statusLabels[step]}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                )}

                                {isCancelled && (
                                    <div className="cancelled-message">
                                        This order has been cancelled.
                                    </div>
                                )}

                                <div className="order-card-content">
                                    <div className="order-items-section">
                                        <h3>Order Items</h3>

                                        {order.items.map((item) => (
                                            <div
                                                className="ordered-item"
                                                key={item._id}
                                            >
                                                <span className="ordered-item-emoji">
                                                    {item.emoji || "🍕"}
                                                </span>

                                                <div>
                                                    <strong>{item.name}</strong>

                                                    <p>
                                                        {item.quantity} × ₹
                                                        {item.price}
                                                        {item.itemType === "custom"
                                                            ? " · Custom Pizza"
                                                            : ""}
                                                    </p>
                                                </div>

                                                <strong>
                                                    ₹
                                                    {item.quantity *
                                                        item.price}
                                                </strong>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="order-information">
                                        <div>
                                            <Clock3 size={18} />

                                            <p>
                                                <span>Ordered on</span>
                                                <strong>
                                                    {new Date(
                                                        order.createdAt
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </strong>
                                            </p>
                                        </div>

                                        <div>
                                            <MapPin size={18} />

                                            <p>
                                                <span>Delivery address</span>
                                                <strong>
                                                    {
                                                        order.deliveryAddress
                                                            .addressLine
                                                    }
                                                    ,{" "}
                                                    {
                                                        order.deliveryAddress
                                                            .city
                                                    }
                                                    ,{" "}
                                                    {
                                                        order.deliveryAddress
                                                            .state
                                                    }{" "}
                                                    {
                                                        order.deliveryAddress
                                                            .postalCode
                                                    }
                                                </strong>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="order-card-footer">
                                    <div>
                                        <span>Payment</span>
                                        <strong>
                                            {order.paymentMethod === "cod"
                                                ? "Cash on Delivery"
                                                : "Online Payment"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Total amount</span>
                                        <strong className="order-total">
                                            ₹{order.totalAmount}
                                        </strong>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}
        </main>
    );
}