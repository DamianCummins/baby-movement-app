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
          return { x: 61, y: 1 }
        case 'high centre':
          return { x: 31, y: 1 }
        case 'high right':
          return { x: 1, y: 1 }
        case 'middle left':
          return { x: 61, y: 31 }
        case 'middle centre':
          return { x: 31, y: 31 }
        case 'middle right':
          return { x: 1, y: 31 }
        case 'low left':
          return { x: 61, y: 61 }
        case 'low centre':
          return { x: 31, y: 61 }
        case 'low right':
          return { x: 1, y: 61 }
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
              return { x: 61, y: 1 }
            case 'high centre':
              return { x: 31, y: 1 }
            case 'high right':
              return { x: 1, y: 1 }
            case 'middle left':
              return { x: 61, y: 31 }
            case 'middle centre':
              return { x: 31, y: 31 }
            case 'middle right':
              return { x: 1, y: 31 }
            case 'low left':
              return { x: 61, y: 61 }
            case 'low centre':
              return { x: 31, y: 61 }
            case 'low right':
              return { x: 1, y: 61 }
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

  function Belly(props:any) {
    return <svg version="1.1" id="Contours" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="450" viewBox="0.000000 0.000000 818.597839 864.929993" xmlSpace="preserve" stroke="black" fill="none" stroke-linecap='round' stroke-linejoin='round'>
    <path d='M396.3 790.3 C388.0 783.5 376.5 782.6 365.9 781.3 C355.2 780.0 343.5 777.3 337.4 768.5 C331.2 759.7 336.0 743.9 346.8 744.3 C430.8 747.9 522.6 748.5 588.9 696.7 C564.2 690.5 539.5 684.3 514.8 678.1 C501.4 674.7 486.6 670.3 479.8 658.2 C473.1 646.2 483.8 626.4 496.7 631.2 C520.9 640.3 547.6 639.2 573.5 638.0 C603.2 636.6 632.9 635.2 662.6 633.8 C671.6 633.4 681.0 632.9 689.0 628.6 C705.1 620.0 710.2 599.7 713.3 581.7 C726.8 502.1 733.2 420.5 722.3 340.5 C711.3 260.5 682.2 181.7 630.5 119.6 C578.9 57.5 503.5 13.4 422.9 8.1 C417.5 7.7 409.6 12.1 413.2 16.1 C409.5 14.4 405.8 12.7 402.0 11.1 C405.7 2.7 417.0 1.6 426.1 2.3 C508.4 8.4 585.0 54.1 637.2 117.9 C689.4 181.8 718.5 262.4 728.9 344.2 C739.4 426.0 732.1 509.2 717.6 590.4 C714.7 606.2 710.5 623.7 696.9 632.4 C689.1 637.3 679.5 638.4 670.2 639.2 C607.5 644.6 544.4 644.7 481.7 639.5 C484.5 659.3 504.8 672.1 524.3 676.6 C543.8 681.0 564.5 680.1 583.5 686.6 C587.9 688.1 592.6 690.4 594.0 694.8 C596.4 702.0 588.7 708.3 581.9 711.7 C511.4 748.4 428.8 761.5 350.4 748.6 C343.1 747.5 338.6 757.9 342.2 764.3 C345.8 770.7 353.4 773.4 360.5 775.3 C411.4 788.8 466.4 786.7 516.1 769.2 C522.9 766.8 527.8 778.0 523.4 783.7 C519.0 789.5 510.8 790.4 503.6 790.9 C442.9 794.9 380.7 798.7 322.4 781.3 C316.2 779.5 311.1 788.2 313.6 794.2 C316.2 800.2 322.7 803.3 328.8 805.6 C375.7 823.5 428.0 827.0 476.9 815.3 C493.5 811.3 510.2 805.5 527.3 806.5 C531.6 815.0 519.9 822.5 510.7 824.6 C454.2 837.7 394.4 835.9 338.8 819.5 C397.9 849.7 468.8 839.1 534.2 827.7 C538.3 834.5 529.0 841.4 521.5 843.6 C482.2 855.2 439.8 855.8 400.2 845.2 C394.1 843.5 385.1 843.1 383.7 849.3 C432.3 863.9 485.0 861.4 534.0 848.2 C583.0 834.9 628.6 811.4 671.6 784.3 C700.8 765.9 729.3 745.4 750.1 717.8 C768.9 693.0 780.5 663.5 790.3 634.0 C800.9 601.8 809.8 569.1 818.6 536.5 C818.5 565.4 809.7 593.6 800.9 621.2 C790.9 653.0 780.6 685.4 761.6 712.8 C736.7 748.7 699.0 773.2 662.0 796.3 C629.3 816.6 595.9 836.7 559.3 848.6 C509.2 864.8 455.5 864.9 402.9 861.9 C390.2 861.1 372.8 853.4 377.6 841.6 C350.8 834.6 326.6 818.4 309.9 796.4 C307.9 793.7 305.9 790.8 305.8 787.5 C305.6 777.4 320.2 775.7 330.1 777.6 C352.2 781.8 374.2 786.1 396.3 790.3 M525.5 836.2 C522.3 834.2 518.2 834.9 514.6 835.7 C488.0 841.4 460.9 844.1 433.7 844.0 C434.6 846.9 438.4 847.5 441.5 847.6 C470.0 848.3 499.3 847.3 525.5 836.2 M439.7 826.4 C439.9 828.2 442.2 828.7 444.1 828.7 C471.2 829.0 498.3 823.5 523.2 812.7 C521.1 809.4 516.1 810.4 512.4 811.7 C489.0 820.1 464.5 825.0 439.7 826.4 M504.8 778.2 C492.5 780.3 480.1 782.5 467.7 784.7 C466.2 785.0 464.1 786.0 464.7 787.5 C470.4 788.8 476.4 788.0 482.2 787.2 C495.5 785.4 508.8 783.6 522.1 781.8 C518.6 776.6 511.0 777.1 504.8 778.2 ' fill ="#000000" stroke="none"/>
    <path d='M395.6 593.1 C392.5 589.8 394.5 583.7 398.7 582.0 C402.9 580.4 408.0 582.9 410.0 586.9 C412.1 590.8 411.6 595.9 409.5 599.8 C405.5 607.2 396.3 611.2 388.1 609.5 C379.9 607.9 373.2 600.9 371.2 592.7 C370.8 591.0 370.7 588.9 371.8 587.5 C372.9 586.1 375.7 586.2 376.1 588.0 C377.6 594.8 382.1 601.4 388.8 603.4 C395.5 605.4 403.9 601.3 404.9 594.4 C401.8 595.8 397.8 595.6 395.6 593.1 M399.5 588.4 C401.1 590.0 403.6 590.7 405.8 590.3 C405.9 587.5 401.6 586.0 399.9 588.2 ' fill ="#000000" stroke="none"/>
    <path d='M389.4 108.9 C398.7 108.8 401.3 123.5 394.7 130.1 C388.2 136.7 377.8 137.2 368.5 137.5 C290.1 140.5 212.5 162.9 144.5 202.1 C107.0 223.7 91.8 269.6 84.0 312.1 C63.5 422.8 73.1 540.6 121.9 642.1 C170.6 743.5 260.3 827.0 368.6 857.8 C332.3 855.7 298.2 839.7 267.8 819.7 C188.7 767.7 129.3 687.8 97.3 598.6 C65.3 509.5 60.1 411.7 77.1 318.6 C82.5 288.8 90.3 259.1 104.7 232.5 C111.5 220.0 120.2 207.7 133.0 201.3 C198.1 168.5 266.1 134.9 339.0 133.9 C359.1 133.6 382.3 134.7 395.7 119.7 C355.4 102.3 308.4 101.3 267.5 117.0 C258.4 120.5 244.2 122.1 242.6 112.5 C279.8 99.3 320.3 95.3 359.4 101.0 C380.5 104.0 407.2 107.5 418.2 89.2 C360.1 67.5 293.4 70.0 237.1 95.9 C231.0 98.7 221.0 99.5 220.7 92.9 C220.5 88.8 225.0 86.3 228.9 84.8 C269.6 69.9 313.7 64.1 356.9 68.1 C378.6 70.1 400.4 74.5 422.0 71.5 C429.5 70.4 438.9 64.9 436.1 57.9 C434.4 53.4 428.7 52.2 424.0 51.6 C353.3 43.1 276.5 35.8 215.5 72.5 C210.1 75.7 203.6 67.9 205.6 61.9 C207.5 56.0 213.7 52.7 219.5 50.2 C269.8 29.1 327.4 25.8 379.8 41.1 C322.1 14.0 250.9 17.8 196.5 50.9 C178.5 61.8 159.7 71.3 140.3 79.3 C142.4 75.6 144.5 71.8 146.6 68.1 C97.3 87.5 64.8 135.7 45.9 185.2 C27.1 234.8 18.7 287.8 0.0 337.5 C8.0 286.5 21.1 236.4 38.8 188.0 C49.5 158.9 62.3 129.9 83.0 106.9 C120.9 64.9 179.9 48.6 223.0 11.9 C229.5 6.4 236.6 0.0 245.1 0.6 C253.6 1.2 259.5 14.5 251.8 18.2 C290.2 17.1 329.6 16.1 365.8 28.6 C386.7 35.9 407.3 47.7 429.3 45.6 C438.5 44.7 445.0 56.6 441.4 65.2 C437.9 73.7 427.9 77.9 418.7 77.9 C426.2 83.5 423.7 96.4 416.3 102.1 C408.8 107.8 398.8 108.5 389.4 108.9 M222.0 62.9 C239.0 54.1 257.1 47.2 275.8 43.7 C284.6 42.0 293.5 41.1 302.5 40.8 C306.2 40.8 310.4 40.7 313.2 38.1 C277.4 34.2 240.4 43.7 211.0 64.4 C214.3 66.5 218.6 64.7 222.0 62.9 M231.1 28.8 C229.5 26.9 226.4 27.5 224.0 28.4 C202.3 36.2 181.6 46.9 162.6 59.9 C166.7 60.7 170.8 58.7 174.6 56.9 C193.4 47.5 212.3 38.2 231.1 28.8 M218.9 24.2 C224.4 24.2 229.7 22.7 234.9 21.2 C238.4 20.2 242.0 19.1 244.7 16.7 C247.4 14.3 248.9 10.1 247.2 6.9 C246.7 5.9 245.8 5.0 244.7 4.9 C243.4 4.7 242.2 5.6 241.2 6.4 C233.7 12.4 226.3 18.3 218.9 24.2 M226.2 93.5 C232.6 93.1 238.8 90.8 243.9 87.0 C237.4 86.0 230.5 88.6 226.2 93.5 ' fill ="#000000" stroke="none"/>
    
    </svg>
  }

  function ReferenceBands(props: any) {
    const { fill, fillOpacity, index, x1, x2, y1, y2 } = props;
    const loc = `${x1} ${x2} ${y1} ${y2}`;
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

    switch(loc){
      case "0 30 0 30":
        return topLeft;
      case "0 30 60 90":
        return topRight;
      case "60 90 0 30":
        return lowLeft;
      case "60 90 60 90":
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
                        fillOpacity={(sector.count / 100)}
                        stroke="white"
                        strokeOpacity={0}
                        shape={
                          rects.includes(index) ? undefined : <ReferenceBands 
                            index={`${index}`}
                            fill="purple"
                            fillOpacity={(sector.count / 100)}
                            x1={sector.x1}
                            x2={sector.x2}
                            y1={sector.y1}
                            y2={sector.y2}
                          />
                        }
                    />
                ))
            }
            <ReferenceArea x1={0} x2={90} y1={0} y2={90} shape={<Belly/>}/>
            <ReferenceArea x1={0} x2={90} y1={0} y2={90} fillOpacity={0} stroke="white" className="bumpImage"/> {/* Pitch Outline */}
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