import { Box, Tab, Tabs, Typography,  } from '@mui/material';
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function History() {

  const [avgDayCountData, setAvgDayCountData] = useState<{name: string, count: number}[]>([]);
  const [avgHourCountData, setAvgHourCountData] = useState<{name: string, count: number}[]>([]);
  const [hourCountData, setHourCountData] = useState<{name: string, count: number}[]>([]);
  const [view, setView] = useState<number>(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setView(newValue);
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/v1/movement', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const json = await res.json() as Record<string, Row[]>;

      setAvgDayCountData(Object.entries(json).map(([day, movements]) => ({name: day.substring(0, day.length-4), count: movements.length})).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime()));
      
      let allRows: Row[] = [];
      Object.values(json).map(rows => allRows = [...allRows,...rows]);

      const groupedByHour = allRows.reduce((acc: Record<string, Pick<Row, Exclude<keyof Row, Row['time']>>[]>, {time, intensity, type, position}: Row) => {
        const hour = new Date(`1970-01-01T${time.substring(0,8)}Z`).getHours() - 1;
        (acc[`${hour}`] = acc[`${hour}`] || []).push({time, intensity, type, position});
        return acc;
      }, {});
    
      let hourCount = 0;
    
      while (hourCount < 24) {
        if (!Object.keys(groupedByHour).includes(`${hourCount}`)) {
          groupedByHour[`${hourCount}`] = [];
        }
        hourCount = hourCount + 1;
      }
      setAvgHourCountData(Object.entries(groupedByHour).map(([hour, movements]) => ({name: hour, count: parseFloat((movements.length / 7).toFixed(2))})).sort());


      const today = Object.entries(json).find(([day, movements]) => new Date(day).getDate() === new Date().getDate());

      if (today) {
        const [,todaysMovements] = today;
        const todayGroupedByHour = todaysMovements.reduce((acc: Record<string, Pick<Row, Exclude<keyof Row, Row['time']>>[]>, {time, intensity, type, position}: Row) => {
          const hour = new Date(`1970-01-01T${time.substring(0,8)}Z`).getHours() - 1;
          (acc[`${hour}`] = acc[`${hour}`] || []).push({time, intensity, type, position});
          return acc;
        }, {});
      
        let hourCount = 0;
    
        while (hourCount < 24) {
          if (!Object.keys(todayGroupedByHour).includes(`${hourCount}`)) {
            todayGroupedByHour[`${hourCount}`] = [];
          }
          hourCount = hourCount + 1;
        }

        setHourCountData(Object.entries(todayGroupedByHour).map(([hour, movements]) => ({name: hour, count: movements.length})).sort());
      }
      
    }

    fetchData().catch((err) => console.error(err))
  }, [])
  
  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={view} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="Today" {...a11yProps(0)} />
          <Tab label="This week" {...a11yProps(1)} />
        </Tabs>
      </Box>

      <TabPanel value={view} index={0}>
        <div className="chartContainer">
          <h3>Today's movements</h3>
          <ResponsiveContainer height={300} width="90%">
            <BarChart 
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
              <YAxis width={50} label={{ value: 'Total Movements', angle: -90, position: 'insideLeft' }} allowDecimals={false}/>
              <Tooltip />
              <CartesianGrid strokeDasharray="3 3" />
              <Bar dataKey="count" barSize={30} fill="#8884d8" background={{ fill: '#eee' }}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </TabPanel>

      <TabPanel value={view} index={1}>
        <div className="chartContainer">
          <h3>Total movements per day this week</h3>
          <ResponsiveContainer height={300} width="90%">
            <BarChart
              data={avgDayCountData} 
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
          </ResponsiveContainer>
        </div>
        <div className="chartContainer">
          <h3>Average movements per hour</h3>
          <ResponsiveContainer height={300} width="90%">
            <BarChart 
              data={avgHourCountData} 
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
          </ResponsiveContainer>
        </div>
      </TabPanel>
    </>
  );
}