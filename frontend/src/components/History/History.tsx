import React from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
const data = [{name: 'Page A', uv: 400, pv: 2400, amt: 2400}];



export default function History() {
  
  return (
    <BarChart width={340} height={500} data={data}>
      <XAxis dataKey="name"/>
      <YAxis />
      <Tooltip />
      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
      <Bar dataKey="uv" barSize={30} />
  </BarChart>
  );
}