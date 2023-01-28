import { Box, Tab, Tabs, Typography,  } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Label, ScatterChart, ReferenceArea, Scatter } from 'recharts';
import './History.css';

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
  const [hourCountData, setHourCountData] = useState<{name: string, count: number, positions: string[] }[]>([]);
  const [heatMapSectors, setHeatMapSectors] = useState<{
      count: number;
      x1: number;
      x2: number;
      y1: number;
      y2: number;
  }[]>([]);
  const [totalHeatMapSectors, setTotalHeatMapSectors] = useState<{
    count: number;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}[]>([]);
  const [view, setView] = useState<number>(0);
  const [selectedHour, setSelectedHour] = useState<number>(8);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setView(newValue);
  };

  const fillInMissingHours = (data: Record<string, Row[]>) => {
    let hourCount = 0;
    
    while (hourCount < 24) {
      if (!Object.keys(data).includes(`${hourCount}`)) {
        data[`${hourCount}`] = [];
      }
      hourCount = hourCount + 1;
    }
  }

  const calculateAvgDayCount = (data: Record<string, Row[]>) => {
    setAvgDayCountData(Object.entries(data)
      .map(([day, movements]) => ({name: day.substring(0, day.length-4), count: movements.length}))
      .sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime()));
  }

  const calculateAvgHourCount = (data: Record<string, Row[]>) => {
    let allRows: Row[] = [];
    Object.values(data).map(rows => allRows = [...allRows,...rows]);

    const groupedByHour = allRows.reduce((acc: Record<string, Pick<Row, Exclude<keyof Row, Row['time']>>[]>, {time, intensity, type, position}: Row) => {
      let hour = new Date(`1970-01-01T${time.substring(0,8)}Z`).getHours();
      if (hour === 24) {
        hour = 0;
      }
      (acc[`${hour}`] = acc[`${hour}`] || []).push({time, intensity, type, position});
      return acc;
    }, {}) as unknown as Record<string, Row[]>;

    fillInMissingHours(groupedByHour);

    setAvgHourCountData(Object.entries(groupedByHour).map(([hour, movements]) => ({name: hour, count: parseFloat((movements.length / 7).toFixed(2))})).sort());
  }

  const calculateHourCount = (data: Record<string, Row[]>) => {
    const today = Object.entries(data).find(([day]) => new Date(day).getDate() === new Date().getDate());

      if (today) {
        const [,todaysMovements] = today;
        const todayGroupedByHour = todaysMovements.reduce((acc: Record<string, Pick<Row, Exclude<keyof Row, Row['time']>>[]>, {time, intensity, type, position}: Row) => {
          let hour = new Date(`1970-01-01T${time.substring(0,8)}Z`).getHours();
          if (hour === 24) {
            hour = 0;
          }
          (acc[`${hour}`] = acc[`${hour}`] || []).push({time, intensity, type, position});
          return acc;
        }, {}) as unknown as Record<string, Row[]>;

        fillInMissingHours(todayGroupedByHour);

        setHourCountData(Object.entries(todayGroupedByHour).map(([hour, movements]) => ({name: hour, count: movements.length, positions: movements.map(movement => movement.position)})).sort());
      }
  }

  const getHeatmapSectors = (locations: {x: number, y: number}[], noOfColumns=3, noOfRows=3) => {
    const sectorWidth = 90 / noOfColumns;
    const sectorHeight = 90 / noOfRows;

    let sectors = []
    let sector = 0;
    let xCount = 0;
    while (xCount < 90) {
        let yCount = 0;
        while(yCount < 90) {
            sectors[sector] = {
                count: 0,
                x1: xCount,
                x2: xCount + sectorWidth,
                y1: yCount,
                y2: yCount + sectorHeight
            };
            for(let loc of locations) {
                if((loc.x > xCount && loc.x < (xCount + sectorWidth)) &&
                    (loc.y > yCount && loc.y <= (yCount + sectorHeight))) {
                    sectors[sector].count++;
                }
            };
            yCount += sectorHeight;
            sector++;
        }
        xCount += sectorWidth;
        sector++;
    }
    return sectors.filter(sector => sector !== undefined);
  }

  const calculateTotalHeatMap = (data: Record<string, Row[]>) => {
    let allRows: Row[] = [];
    Object.values(data).map(rows => allRows = [...allRows,...rows]);
    
    const positions = allRows.map(row => row.position);

    const locations = positions.map(position => {
      switch(position) {
        case 'high left':
          return { x: 1, y: 61 }
        case 'high centre':
          return { x: 31, y: 61 }
        case 'high right':
          return { x: 61, y: 61 }
        case 'middle left':
          return { x: 1, y: 31 }
        case 'middle centre':
          return { x: 31, y: 31 }
        case 'middle right':
          return { x: 61, y: 31 }
        case 'low left':
          return { x: 1, y: 1 }
        case 'low centre':
          return { x: 31, y: 1 }
        case 'low right':
          return { x: 61, y: 1 }
        default:
          return;
      }
    }).filter(loc => loc !== undefined) as { x: number, y: number }[];

    if (locations) {
      const sectors = getHeatmapSectors(locations)
      setTotalHeatMapSectors(sectors);

    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/v1/movement', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const json = await res.json() as Record<string, Row[]>;

      calculateAvgDayCount(json);
      calculateAvgHourCount(json);
      calculateHourCount(json);
      calculateTotalHeatMap(json);
    }

    fetchData().catch((err) => console.error(err))
  }, [])

  const handleHourClick = (data: number, index: number) => {
    setSelectedHour(index);
  };
  
  useEffect(() => {
    if (hourCountData && selectedHour) {
      const hourData = hourCountData[selectedHour];

      if (hourData) {
        const locations = hourData.positions?.map(position => {
          switch(position) {
            case 'high left':
              return { x: 1, y: 61 }
            case 'high centre':
              return { x: 31, y: 61 }
            case 'high right':
              return { x: 61, y: 61 }
            case 'middle left':
              return { x: 1, y: 31 }
            case 'middle centre':
              return { x: 31, y: 31 }
            case 'middle right':
              return { x: 61, y: 31 }
            case 'low left':
              return { x: 1, y: 1 }
            case 'low centre':
              return { x: 31, y: 1 }
            case 'low right':
              return { x: 61, y: 1 }
            default:
              return;
          }
        }).filter(loc => loc !== undefined) as { x: number, y: number }[];

        if (locations) {
          const sectors = getHeatmapSectors(locations)
          setHeatMapSectors(sectors);

        }
      }
      
    }
  }, [selectedHour]);

  function ReferenceBands(props: any) {
    const { fill, fillOpacity, index } = props;
    const topLeft = <g transform="translate(100,100)" stroke="white" strokeOpacity={0}>
      <path d={`M 56 56 L -80 56 A 156 -156 0 0 1 56 -80`} fill={fill} fillOpacity={fillOpacity}/>
    </g>;

    const topRight = <g transform="translate(100,100)" stroke="white" strokeOpacity={0}>
      <path d={`M 194 56 L 329 56 A 156 -156 0 0 0 194 -80`} fill={fill} fillOpacity={fillOpacity}/>
    </g>

    const lowLeft = <g transform="translate(100,100)" stroke="white" strokeOpacity={0}>
      <path d={`M 56 194 L 56 329 A 156 -156 0 0 1 -80 194`} fill={fill} fillOpacity={fillOpacity}/>
    </g>

    const lowRight = <g transform="translate(100,100)" stroke="white" strokeOpacity={0}>
      <path d={`M 194 194 L 330 194 A 156 -156 0 0 1 194 330`} fill={fill} fillOpacity={fillOpacity}/>
    </g>

    switch(index){
      case "0":
        return topLeft;
      case "2":
        return topRight;
      case "6":
        return lowLeft;
      case "8":
        return lowRight;
      default:
        return topLeft;
    }
  }


  const rects = [1,3,4,5,7];
  const renderScatterChart = (heatSectors: {count: number, x1: number, x2: number, y1: number, y2: number}[], scale: number) => (
    <div className="bump">
        <ScatterChart
            width={90*scale}
            height={90*scale}
            margin={{
                top: 20, right: 20, bottom: 20, left: 20,
            }}
        >
            {
                /* 
                    Map the various heat sectors as ReferenceAreas onto the pitch,
                    using `sector.count` to determine opacity
                */

                heatSectors.map((sector, index) => (
                    <ReferenceArea 
                        key={index}
                        x1={sector.x1}
                        x2={sector.x2}
                        y1={sector.y1}
                        y2={sector.y2} 
                        fill="purple"
                        fillOpacity={(sector.count / 100) * 1.2}
                        stroke="white"
                        strokeOpacity={0}
                        shape={
                          rects.includes(index) ? undefined : <ReferenceBands 
                            index={`${index}`}
                            fill="purple"
                            fillOpacity={(sector.count / 100) * 1.2}
                            x1={sector.x1}
                            x2={sector.x2}
                            y1={sector.y1}
                            y2={sector.y2}
                          />
                        }
                    />
                ))
            }
            <ReferenceArea x1={0} x2={90} y1={0} y2={90} fillOpacity={0} stroke="white" /> {/* Pitch Outline */}
            <XAxis type="number" dataKey="x" hide domain={[0,90]}/>
            <YAxis type="number" dataKey="y" hide domain={[0,90]}/>
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        </ScatterChart>
    </div>
  );

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
              <Bar dataKey="count" barSize={30} fill="#8884d8" background={{ fill: '#eee' }} onClick={handleHourClick}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chartContainer heatMap">
          <h3>Movement Positions</h3>
          <ResponsiveContainer height={500} width="fit-content">
            {renderScatterChart(heatMapSectors, 5)}
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
        <div className="chartContainer heatMap">
            <h3>Movement Positions</h3>
            <ResponsiveContainer height={500} width="fit-content">
              {renderScatterChart(totalHeatMapSectors, 5)}
            </ResponsiveContainer>
        </div>
      </TabPanel>
    </>
  );
}