import { fetchWithAuth } from './api';

export const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export const processPayment = async (user: { name: string; email: string; id: string }, onSuccess: () => void) => {
    const res = await loadRazorpay();
    if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
    }

    try {
        // 1. Create Order
        const orderRes = await fetchWithAuth('/create-order', {
            method: 'POST',
            body: JSON.stringify({}) // Body can be empty, user ID is in token
        });

        if (!orderRes.ok) throw new Error('Failed to create order');
        const order = await orderRes.json();

        // 2. Open Razorpay
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name: "RootSearch",
            description: "Pro Plan Subscription",
            order_id: order.id,
            handler: async function (response: any) {
                // 3. Verify Payment
                try {
                    const verifyRes = await fetchWithAuth('/verify-payment', {
                        method: 'POST',
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            user_id: user.id
                        })
                    });

                    if (verifyRes.ok) {
                        const data = await verifyRes.json();
                        if (data.status === 'success') {
                            alert('Payment Successful! Welcome to Pro.');
                            onSuccess();
                        } else {
                            alert('Payment verification failed.');
                        }
                    } else {
                        alert('Payment verification failed.');
                    }
                } catch (error) {
                    console.error("Verification Error", error);
                    alert('Payment verification failed error.');
                }
            },
            prefill: {
                name: user.name,
                email: user.email,
            },
            theme: {
                color: "#8b5cf6"
            }
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();

    } catch (error) {
        console.error("Payment Error", error);
        alert('Something went wrong initiating payment.');
    }
};
