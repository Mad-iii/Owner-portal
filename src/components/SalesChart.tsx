"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SalesChart({ storeId }: { storeId: string }) {
    const [data, setData] = useState([]);

    useEffect(() => {
        fetch(`/api/dashboard/sales-chart?storeId=${storeId}`)
            .then((r) => r.json())
            .then(setData);
    }, [storeId]);

    return (
        <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#000" strokeWidth={2} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
}