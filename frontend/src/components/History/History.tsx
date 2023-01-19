import React, { useEffect, useState } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';
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

  const [dayCountData, setDayCountData] = useState<{name: string, count: number}[]>([]);
  const [hourCountData, setHourCountData] = useState<{name: string, count: number}[]>([]);

  

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/v1/movement', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const json = await res.json() as Record<string, Row[]>;

      setDayCountData(Object.entries(json).map(([day, movements]) => ({name: day.substring(0, day.length-4), count: movements.length})).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime()));
      
      let allRows: Row[] = [];
      Object.values(json).map(rows => allRows = [...allRows,...rows]);

      const groupedByHour = allRows.reduce((acc: Record<string, Pick<Row, Exclude<keyof Row, Row['time']>>[]>, {time, intensity, type, position}: Row) => {
        const hour = new Date(`1970-01-01T${time.substring(0,8)}Z`).getHours();
        (acc[`${hour}`] = acc[`${hour}`] || []).push({time, intensity, type, position});
        return acc;
      }, {});
    
      let hourCount = 0;
    
      while (hourCount <= 24) {
        if (!Object.keys(groupedByHour).includes(`${hourCount}`)) {
          groupedByHour[`${hourCount}`] = [];
        }
        hourCount = hourCount + 1;
      }
      setHourCountData(Object.entries(groupedByHour).map(([hour, movements]) => ({name: hour, count: parseFloat((movements.length / 7).toFixed(2))})).sort());
    }

    fetchData().catch((err) => console.error(err))
  }, [])
  
  return (
    <>
      <div className="chartContainer">
        <h3>Total movements per day this week</h3>
        <BarChart 
          width={600} 
          height={300} 
          data={dayCountData} 
          margin={{
              top: 5,
              right: 5,
              left: 5,
              bottom: 5,
            }}
            barSize={20}>
          <XAxis dataKey="name" angle={45} height={70}>
            <Label value="Days" offset={0} position="insideBottom" />
          </XAxis>
          <YAxis width={50} label={{ value: 'Total Movements', angle: -90, position: 'insideLeft' }}/>
          
          <Tooltip />
          <CartesianGrid strokeDasharray="3 3" />
          <Bar dataKey="count" barSize={30} fill="#8884d8" background={{ fill: '#eee' }}/>
        </BarChart>
      </div>
      <div className="chartContainer">
        <h3>Average movements per hour</h3>
        <BarChart 
          width={600} 
          height={300} 
          data={hourCountData} 
          margin={{
              top: 5,
              right: 5,
              left: 5,
              bottom: 5,
            }}
            barSize={20}>
          <XAxis dataKey="name" angle={45} height={70}>
            <Label value="Hours" offset={0} position="insideBottom" />
          </XAxis>
          <YAxis width={50} label={{ value: 'Average Movements', angle: -90, position: 'insideLeft' }}/>
          <Tooltip />
          <CartesianGrid strokeDasharray="3 3" />
          <Bar dataKey="count" barSize={30} fill="#8884d8" background={{ fill: '#eee' }}/>
        </BarChart>
      </div>
    </>
  );
}