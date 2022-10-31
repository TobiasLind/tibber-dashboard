var tibberToken = "5K4MVS-OjfWhK_4yrjOlFe1F6kJXPVf7eQYggo8ebAE"; //DEMO Token, add your Tibber access token here
var powergridfee = [70.0,12.0];
var priceChart;
var today;

function removeData(chart) {
	chart.data.datasets.pop();
	chart.data.datasets.pop();
    chart.update();
}

async function drawPriceDiagram() {

	  		
	  		let data = {
	  			query: "{\n  viewer {\n    homes {\n      currentSubscription{\n        priceInfo{\n          current{\n            total\n            energy\n            tax\n            startsAt\n          }\n          today {\n            total\n            energy\n            tax\n            startsAt\n          }\n          tomorrow {\n            total\n            energy\n            tax\n            startsAt\n          }\n        }\n      }\n    }\n  }\n}\n"
	  		}
	  		const response = await fetch('https://api.tibber.com/v1-beta/gql', {
			    method: 'POST',
			    body: JSON.stringify(data),
		    	headers: {
			      'Content-Type': 'application/json',
			      'Accept': 'application/json',
			      'Authorization':  tibberToken
		    	}
			});
			console.log(response);
			const myJson = await response.json(); //extract JSON from the http response
			
			const todaysPrices = myJson.data.viewer.homes[0].currentSubscription.priceInfo.today
			today = [];
			todayIncGridFee = [];
			
			for (let i = 0; i < todaysPrices.length; i++) {				
				let time=new Date(todaysPrices[i].startsAt)
				if((time.getMonth()>9 || time.getMonth()<3) && (time.getHours()>5 && time.getHours()<22) && time.getDay() !=0 && time.getDay()!=6){
					today.push(todaysPrices[i].energy*100);
					todayIncGridFee.push(todaysPrices[i].energy*100+powergridfee[0]);
				}
				else{
					today.push(todaysPrices[i].energy*100);
					todayIncGridFee.push(todaysPrices[i].energy*100+powergridfee[1]);
				}
			}
			
			const tomorrowsPrices = myJson.data.viewer.homes[0].currentSubscription.priceInfo.tomorrow
			tomorrow = [];
			tomorrowIncGridFee = [];
			for (let i = 0; i < tomorrowsPrices.length; i++) {
				let time=new Date(tomorrowsPrices[i].startsAt)

				if((time.getMonth()>9 || time.getMonth()<3) && (time.getHours()>5 && time.getHours()<22) && time.getDay() !=0 && time.getDay()!=6){
					tomorrow.push(tomorrowsPrices[i].energy*100);
					tomorrowIncGridFee.push(tomorrowsPrices[i].energy*100+powergridfee[0]);
				}
				else{
					tomorrow.push(tomorrowsPrices[i].energy*100);
					tomorrowIncGridFee.push(tomorrowsPrices[i].energy*100+powergridfee[1]);
				}
			}
			
//////// Calculate best continues 3h for water heater
			let twoDayPrices = todayIncGridFee.concat(tomorrowIncGridFee);
			let startAt = new Date().getHours();
			let smallestSum3 = 10000;
			let smallestSum8 = 10000;
			let timeForsmallestSum3;
			let timeForsmallestSum8;

			for(let i = startAt; i < twoDayPrices.length; i++) {
				let sum = twoDayPrices[i]+twoDayPrices[i+1]+twoDayPrices[i+2];
				if(sum<smallestSum3){
					smallestSum3=sum;
					timeForsmallestSum3=i;
				}
				sum = twoDayPrices[i]+twoDayPrices[i+1]+twoDayPrices[i+2]+twoDayPrices[i+3]+twoDayPrices[i+4]+twoDayPrices[i+5]+twoDayPrices[i+6]+twoDayPrices[i+7];
				if(sum<smallestSum8){
					smallestSum8=sum;
					timeForsmallestSum8=i;
				}
			}
			if(timeForsmallestSum3<24)
				startAt = new Date(todaysPrices[timeForsmallestSum3].startsAt)
			else{
				startAt = new Date(tomorrowsPrices[timeForsmallestSum3-24].startsAt)
			}
			document.getElementById("whenToStartWaterHeater").innerHTML = "Water heater should start at "+startAt.getDate()+"/"+(startAt.getMonth()+1)+" at "+String(startAt.getHours()).padStart(2, '0')+".00";

			if(timeForsmallestSum8<24)
				startAt = new Date(todaysPrices[timeForsmallestSum8].startsAt)
			else{
				startAt = new Date(tomorrowsPrices[timeForsmallestSum8-24].startsAt)
			}
			//document.getElementById("whenToStartAirCondition").innerHTML = "Luftv&auml;rmepumpen b&ouml;r startas "+startAt.getDate()+"/"+(startAt.getMonth()+1)+" klockan "+String(startAt.getHours()).padStart(2, '0');
			
////////

//////// Add an extra pricepoint with same value as the last at the end to tidy up the graph
			today.push(today[23]);
			todayIncGridFee.push(todayIncGridFee[23]);
			tomorrow.push(tomorrow[23]);
			tomorrowIncGridFee.push(tomorrowIncGridFee[23]);		

////////

			if(priceChart != null){
   				priceChart.destroy();
			}
			priceChart = new Chart(document.getElementById("price-chart"), {
				type: 'line',
				data: {
					labels: [00,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
					datasets: [

						{
							label: "Today's prices inc. power grid fee",
							backgroundColor: ["#ffffff"],
							stepped: true,
							borderColor: "#3e95cd",
    						tension: 0.1,
							data: todayIncGridFee
						},	
						{
							label: "Tomorrow's prices inc. power grid fee",
							backgroundColor: ["#ffffff"],
							stepped: true,
							borderColor: "#FF0000",
    						tension: 0.1,
							data: tomorrowIncGridFee
						},	
						{
							label: "Today's prices",
							backgroundColor: ["#ffffff"],
							stepped: true,
							borderColor: "#3e95cd",
							borderDash: [10,5],
    						tension: 0.1,
							data: today
						},				
						{
							label: "Tomorrow's prices",
							backgroundColor: ["#ffffff"],
							stepped: true,
							borderDash: [10,5],
							borderColor: "#FF0000",
    						tension: 0.1,
							data: tomorrow
						}

					]
				},
				options: {
					legend: { display: false },
					title: {
						display: true,
						text: "Today's prices"
					},
        			scales: {
			            y: {
			                beginAtZero: true
			            }
			        }
				}
			});

		}
		
