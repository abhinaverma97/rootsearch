export const plans = [
    {
        id: "free",
        name: "Free",
        price: "0",
        description: "Perfect for exploring the pulse of the boards and finding basic signals.",
        features: [
            "Real-time Board Stats & Growth",
            "Basic Keyword Search (Live Mode)",
            "Limited Analyzed Search",
            "Top 3 AI Insights per Board",
            "Standard Result Speed",
            "Limited Collections"
        ],
        cta: "Start Exploring",
        href: "/boards",
        highlight: false
    },
    {
        id: "pro",
        name: "Early Bird Access",
        price: "10",
        originalPrice: "20",
        description: "Limited time pricing.",
        features: [
            "Unlimited AI Deep-dives",
            "Unlimited Advanced Search (Analyzed)",
            "Advanced Intent & Industry Filtering",
            "Unlimited Keyword Tracking",
            "Full Thread Context View",
            "Unlimited Collections & Saves"
        ],
        cta: "Go Full Access",
        href: "/boards",
        highlight: true
    }
];
