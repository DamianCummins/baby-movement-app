import React, { useEffect, useState } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './History.css';
// const data = [{name: 'Page A', uv: 400, pv: 2400, amt: 2400}];

type Row = {
  date: string,
  time: string,
  intensity: string,
  type: string,
  position: string
}

export default function History() {

  const [countData, setCountData] = useState<{name: string, count: number}[]>([]);

  

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/v1/movement', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const json = await res.json() as Record<string, Row[]>;

      setCountData(Object.entries(json).map(([day, movements]) => ({name: day.substring(0, day.length-4), count: movements.length})).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime()));
    }

    fetchData().catch((err) => console.error(err))
  }, [])
  
  return (
      <BarChart 
        width={320} 
        height={500} 
        data={countData} 
        margin={{
            top: 5,
            right: 5,
            left: 5,
            bottom: 5,
          }}
          barSize={20}>
        <XAxis dataKey="name" padding={{ left: 10, right: 10 }} angle={45} height={100}/>
        <YAxis width={10}/>
        <Tooltip />
        <Legend />
        <CartesianGrid strokeDasharray="3 3" />
        <Bar dataKey="count" barSize={30} fill="#8884d8" background={{ fill: '#eee' }}/>
      </BarChart>
  );
}