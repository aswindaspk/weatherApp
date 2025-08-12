const cityInput = document.querySelector('.city-input')
const searchBtn = document.querySelector('.search-btn')
const notFoundSection = document.querySelector('.not-found')
const searchCitySection = document.querySelector('.search-city')
const displayWeatherSection = document.querySelector('.container-main')


//WEATHER DATA FROM HTML

const locationText  = document.querySelector('.locationText')
const dateToday = document.querySelector('.date')
const timeNow = document.querySelector('.time-now')
const weatherImg = document.querySelector('.weather-icon')
const temperature = document.querySelector('.temperature')
const weather_type = document.querySelector('.weather-type')
const feelsLike = document.querySelector('.feels-like')
const humidityValue = document.querySelector('.humidity-value')
const wind_speed = document.querySelector('.wind_speed')
const aqiValue = document.querySelector('.aqi')
const futureForecastContainer = document.querySelector('.future-forecast-container')
const sunriseTime = document.querySelector('.sunrise')
const sunsetTime = document.querySelector('.sunset')
const locationBtn = document.querySelector('.location-btn')
const displayDiv = document.getElementById('main')



// Loading Overlay
const loadingOverlay = document.querySelector('#loading-overlay')
loadingOverlay.style.display = 'none';






// API KEY
const weatherApiKey = 'd173b2e0952bc52ffaa9b5006f168438'
const timeZoneApiKey = '13IZKCCOJM65'




searchBtn.addEventListener('click', () => {
    displayDiv.scrollIntoView({behavior:"smooth"})
    if (cityInput.value.trim() != '') {
     findWeather(cityInput.value.trim())
     cityInput.value = ''
     cityInput.blur()   
    }
})




cityInput.addEventListener('keydown', (event) =>{
    displayDiv.scrollIntoView({behavior:"smooth"})
    if (cityInput.value.trim() != '' && event.key == 'Enter') {
        findWeather(cityInput.value.trim())
        cityInput.value = ''
        cityInput.blur()
    }
})


locationBtn.addEventListener('click', ()=>{
    displayDiv.scrollIntoView({behavior:"smooth"})
    getCoordinates()
})




async function findWeather(city) {

loadingOverlay.style.display = 'flex';

    try{
    const weatherData = await fetchWeatherData('weather', city)
    console.log(weatherData);

    if (weatherData.cod != 200) {
        showDisplaySection(notFoundSection)
        return
    }

    showDisplaySection(displayWeatherSection)

    const {
        name : name,
        main : { temp, humidity, feels_like },
        weather : [{ id, description }],
        wind : { speed, deg },
        dt : dt,
        timezone : timezone,
        coord : { lat, lon },
        sys : { sunrise, sunset}
    } = weatherData



    locationText.textContent = name
    temperature.textContent = Math.round(temp) + '°C'
    weather_type.textContent = description
    feelsLike.textContent = Math.round(feels_like) +'°C'
    humidityValue.textContent = humidity +' %'
    wind_speed.textContent = `${getWindDirection(deg)}`+' '+Math.round(speed*3.6) +' km/h'
    weatherImg.src = `./assets/weather/${getWeatherImg(id)}`
    const [dateNowData,timeNowData]= await getTime(lat, lon)
    timeNow.textContent = timeNowData
    dateToday.textContent = dateNowData
    sunriseTime.textContent = `${getSunTime(sunrise,timezone)}`
    const [aqiReading,aqiColor] = await getAirQualityIndex(lat, lon)
    aqiValue.textContent = aqiReading
    aqiValue.style.color = aqiColor


    //forecast data access
    await getForecastData(name)
}
finally{
    loadingOverlay.style.display = 'none';
}

    

} 


async function fetchWeatherData(endPoint, city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${weatherApiKey}&units=metric`
    const response = await fetch(apiUrl)
    return response.json()
}


function showDisplaySection(section) {
    [notFoundSection, searchCitySection, displayWeatherSection].forEach( sec => sec.style.display = 'none' )

    if (displayWeatherSection) {    
        section.style.display = ''
    } else {
        section.style.display = 'flex'
    }
}

function getWeatherImg(id) {
    
    if (id <=232) {
        return 'thunderstorm.svg'
    }
    else if(id >=300 && id <= 321){
        return 'drizzle.svg'
    }
    else if(id >= 500 && id <= 531){
        return 'rain.svg'
    }
    else if(id >= 600 && id <= 622){
        return 'snow.svg'
    }
    else if(id >= 701 && id <= 781){
        return 'atmosphere.svg'
    }
    else if(id == 800){
        return 'clear.svg'
    }
    else if(id >= 801&& id <= 804){
        return 'clouds.svg'
    }
}



async function getTime(lat, lon) {
    const timeApiUrl = `http://api.timezonedb.com/v2.1/get-time-zone?key=${timeZoneApiKey}&format=json&by=position&lat=${lat}&lng=${lon}`;
    const timeDataResponse = await fetch(timeApiUrl)
    const timeData = await timeDataResponse.json()
    const timeValue = new Date(timeData.formatted)
    console.log(timeValue);
    const optionDate = { weekday: 'short', day: 'numeric', month: 'long' };
    const formattedDate = timeValue.toLocaleDateString('en-US', optionDate);
    console.log(formattedDate);
    
    const optionTime = { hour: '2-digit', minute: '2-digit', hour12: true}
    const formattedTime = timeValue.toLocaleTimeString('en-US', optionTime)
    return [formattedDate, formattedTime]
}

function getSunTime(dt,timezone) {
    const localUtc = dt *1000
    const localOffset = timezone*1000
    const localTimeStamp = localUtc + localOffset
    const localTime = new Date(localTimeStamp)
    const optionTime = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC'}
    const formattedTime = localTime.toLocaleTimeString('en-US', optionTime)
    return formattedTime
}



//5-day forecast data

async function getForecastData(city) {
    const forecastData = await fetchWeatherData('forecast', city);
    
    const includedTime = '12:00:00';
    const dailyForecasts = forecastData.list.filter(item =>
        item.dt_txt.includes(includedTime)
    );

    futureForecastContainer.innerHTML = '';

    dailyForecasts.forEach(forecastWeather => {
        forecastWeatherInfo(forecastWeather);
    });
}


function forecastWeatherInfo(forecastWeather) {
    const { dt_txt, main: { temp }, weather : [{ id, main }] } = forecastWeather;
    const forecastDate = new Date(dt_txt);
    const optionDate = { weekday: 'short', day: 'numeric', month: 'short' };
    const formattedForecastDate = forecastDate.toLocaleDateString('en-US', optionDate);
    const iconSrc = `./assets/weather/${getWeatherImg(id)}`;

    const forecastHTML = `
    <hr>
        <div class="future-forecast-value">
            <div class="f-f-v-icon">
                <img src="${iconSrc}" alt="${main}" class="ffv-icon">
            </div>
            <div class="f-f-v-reading">${Math.round(temp)}°C</div>
            <div class="f-f-v-day">${formattedForecastDate}</div>
        </div>
        `;

    futureForecastContainer.innerHTML += forecastHTML;
}



//wind direction

function getWindDirection(deg) {
    if (deg >= 348.75 || deg < 11.25) {
        return 'N';
    } else if (deg >= 11.25 && deg < 33.75) {
        return 'NNE';
    } else if (deg >= 33.75 && deg < 56.25) {
        return 'NE';
    } else if (deg >= 56.25 && deg < 78.75) {
        return 'ENE';
    } else if (deg >= 78.75 && deg < 101.25) {
        return 'E';
    } else if (deg >= 101.25 && deg < 123.75) {
        return 'ESE';
    } else if (deg >= 123.75 && deg < 146.25) {
        return 'SE';
    } else if (deg >= 146.25 && deg < 168.75) {
        return 'SSE';
    } else if (deg >= 168.75 && deg < 191.25) {
        return 'S';
    } else if (deg >= 191.25 && deg < 213.75) {
        return 'SSW';
    } else if (deg >= 213.75 && deg < 236.25) {
        return 'SW';
    } else if (deg >= 236.25 && deg < 258.75) {
        return 'WSW';
    } else if (deg >= 258.75 && deg < 281.25) {
        return 'W';
    } else if (deg >= 281.25 && deg < 303.75) {
        return 'WNW';
    } else if (deg >= 303.75 && deg < 326.25) {
        return 'NW';
    } else if (deg >= 326.25 && deg < 348.75) {
        return 'NNW';
    } else {
        return 'Unknown';
    }
}




//aqi

async function getAirQualityIndex(lat, lon) {

    const aqiApi = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${weatherApiKey}`
    const aqiDataResponse = await fetch(aqiApi)
    const aqiData = await aqiDataResponse.json()
    console.log(aqiData);
    
    const aqiValue = aqiData.list[0].main.aqi

    if (aqiValue === 1) return ['Good','#00E400'];
    if (aqiValue === 2) return ['Fair','#FFFF00'];
    if (aqiValue === 3) return ['Moderate','#FF7E00'];
    if (aqiValue === 4) return ['Poor','#FF0000'];
    if (aqiValue === 5) return ['Very Poor','#99004C'];
}


async function getCoordinates() {
    navigator.geolocation.getCurrentPosition(async position => {
        const {latitude, longitude} = position.coords;
        console.log(latitude, longitude);
        const locApi = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        const data =await fetch(locApi)
        const locationName = await data.json()
        console.log(locationName.locality);
        findWeather(locationName.locality)

    })
}