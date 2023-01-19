import React, { FormEvent, useState } from 'react';
import { BottomNavigation, BottomNavigationAction, Button, createTheme, FormLabel, Paper, Slider, TextField, ThemeProvider } from '@mui/material';
import {Publish as PublishIcon, BarChart as BarChartIcon} from '@mui/icons-material';
import { ButtonGrid } from './components/ButtonGrid';
import './App.css';
import { History } from './components/History';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';

export default function App() {
  const intensityValues = [
    {
      value: 0,
      label: 'gentle'
    },
    {
      value: 1,
      label: 'medium'
    },
    {
      value: 2,
      label: 'strong'
    },
    {
      value: 3,
      label: 'ouch'
    }
  ];

  const frequencyValues = [
    {
      value: 0,
      label: 'irregular'
    },
    {
      value: 1,
      label: 'frequent'
    },
    {
      value: 2,
      label: 'frantic'
    }
  ];

  const [content, setContent] = useState<number>(0);
  const [intensity, setIntensity] = useState<string>(intensityValues[0].label);
  const [frequency, setFrequency] = useState<string>(frequencyValues[0].label);
  const [type, setType] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [date, setDate] = useState<Date | null>(new Date());

  const theme = createTheme({
    palette: {
      primary: {
        main: '#8884d8',
      }
    }
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const now = new Date();

    await fetch('/api/v1/movement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: date ? date.toDateString() : now.toDateString(),
        time: date ? date.toTimeString() : now.toTimeString(),
        intensity,
        frequency,
        type,
        position
      })
    });
    setIntensity(intensityValues[0].label);
    setFrequency(frequencyValues[0].label);
    setType('');
    setPosition('');
    setDate(new Date());
  }  

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <h2>Baby Movement App</h2>
        <div className="content">
          {
            content === 0 ? 
              <form onSubmit={handleSubmit}>
                <div className="sliderInput">
                  <FormLabel>Intensity:</FormLabel>
                  <div className='sliderContainer'>
                    <Slider 
                      size="medium"
                      max={3}
                      onChange={(evt, value) => value !== undefined && setIntensity(intensityValues[value as number].label)}
                      value={intensityValues.findIndex(option => option.label === intensity)}
                      marks={intensityValues}
                    />
                  </div>
                </div>

                <div className="sliderInput">
                  <FormLabel>Frequency:</FormLabel>
                  <div className='sliderContainer'>
                    <Slider 
                      size="medium"
                      max={2}
                      onChange={(evt, value) => value !== undefined && setFrequency(frequencyValues[value as number].label)}
                      value={frequencyValues.findIndex(option => option.label === frequency)}
                      marks={frequencyValues}
                    />
                  </div>
                </div>

                <div className="typeInput">
                  <FormLabel>Type:</FormLabel>
                  <div className="movementTypes">
                    <Button className={`movementType ${type === 'kick' ? 'chosen' : ''}`} variant="contained" onClick={() => setType('kick')}>Kick</Button>
                    <Button className={`movementType ${type === 'twitch' ? 'chosen' : ''}`} variant="contained" onClick={() => setType('twitch')}>Twitch</Button>
                    <Button className={`movementType ${type === 'roll' ? 'chosen' : ''}`} variant="contained" onClick={() => setType('roll')}>Roll</Button>
                  </div>
                </div>

                <div className="dateInput">
                  <FormLabel>Date and Time:</FormLabel>
                    <div className="datePickerContainer">
                      <LocalizationProvider dateAdapter={AdapterMoment}>
                        <DateTimePicker
                            renderInput={(props) => <TextField {...props} />}
                            value={moment(date)}
                            onChange={(newDate) => {
                              newDate && setDate(newDate.toDate());
                            }}
                          />
                      </LocalizationProvider>
                    </div>
                </div>
                <div className="positionInput">
                  <FormLabel>Position:</FormLabel>
                  <ButtonGrid setPosition={setPosition} selected={position}/>
                </div>
                <Button disabled={!type || !position} className="Submit" type="submit" variant="contained">Submit</Button>
              </form>
              : <History/>
          }
        </div>
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation
          showLabels
          value={content}
          onChange={(event, newValue) => {
            setContent(newValue);
          }}
        >
          <BottomNavigationAction label="Capture" icon={<PublishIcon />} />
          <BottomNavigationAction label="History" icon={<BarChartIcon />} />
        </BottomNavigation>
        </Paper>

      </div>
    </ThemeProvider>
  );
}
