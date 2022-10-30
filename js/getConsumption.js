var myConsumtionChart;
async function drawConsumptionDiagram(numberOfDays) {

	  		const powergridfee = [62.5,11.0];
			const today = new Date();
		
	  		let data = {
	  			query: "{\n viewer {\n   homes {\n     consumption(resolution: HOURLY, last: "+(today.getHours()+numberOfDays*24-1)+") {\n       nodes {\n         from\n         to\n         cost\n         unitPrice\n         unitPriceVAT\n         consumption\n         consumptionUnit\n       }\n     }\n     currentSubscription {\n       status\n       priceInfo {\n         current {\n           total\n           energy\n           tax\n           startsAt\n         }\n       }\n     }\n   }\n }\n}"
	  		}
	  		const response = await fetch('https://api.tibber.com/v1-beta/gql', {
			    method: 'POST',
			    body: JSON.stringify(data),
		    	headers: {
			      'Content-Type': 'application/json',
			      'Accept': 'application/json',
			      'Authorization': tibberToken
		    	}
			});
			console.log(response);
			const myJson = await response.json(); //extract JSON from the http response
			
			const dataArray = myJson.data.viewer.homes[0].consumption.nodes;
			consumption = [];
			cost = [];
			unitPrice = [];
			priceIncGridFee = [];
			labels = [];	
			
			for (let i = 0; i < dataArray.length; i++) {				
				let time=new Date(dataArray[i].from)
				if(dataArray[i].consumption!=null){
					labels.push(time.getDate()+"/"+(time.getMonth()+1)+", "+String(time.getHours()).padStart(2, '0')+".00");
					cost.push(dataArray[i].cost);
					consumption.push((dataArray[i].consumption));
					unitPrice.push(dataArray[i].unitPrice*100);

					if((time.getMonth()>9 || time.getMonth()<3) && (time.getHours()>5 && time.getHours()<22) && time.getDay() !=0 && time.getDay()!=6){
						priceIncGridFee.push(unitPrice[i]+powergridfee[0]);
					}
					else{
						priceIncGridFee.push(unitPrice[i]+powergridfee[1]);
					}				
				}
				
			}

			let totalCost = 0;
			let totalConsumption = 0;
			let totalUnitPrice = 0;
			for (let i = 0; i < cost.length; i++) {	
				totalCost = totalCost+cost[i];
				totalConsumption = totalConsumption+consumption[i];
				totalUnitPrice = totalUnitPrice+unitPrice[i];
				
			}
			let avgCostPerConsumedkWh = totalCost/totalConsumption;
			let avgCostPerkWh = totalUnitPrice/cost.length;
			
			
			if(myConsumtionChart != null){
   				myConsumtionChart.destroy();
			}
			myConsumtionChart = new Chart(document.getElementById("consumption-chart").getContext("2d"), {
				data: {
					labels: labels,
					datasets: [

						{
							label: "kWh price inc. power grid fee",
							type: 'line',
							backgroundColor: ["#FF0000"],
							stepped: true,
							borderColor: "#FF0000",
    						tension: 0.1,
    						yAxisID: 'y1',
							data: priceIncGridFee
						},
/*
						{
							label: "kWh-pris",
							type: 'line',
							backgroundColor: ["#68F950"],
							stepped: true,
							borderColor: "#68F950",
    						tension: 0.1,
    						yAxisID: 'y1',
							data: unitPrice
						},	
*/											
						{
							label: "Consumption (kWh)",
							type: 'bar',
							backgroundColor: ["#3e95cd"],
							borderColor: "#3e95cd",
							yAxisID: 'y',
							data: consumption
						}
					]
				},
				options: {
					legend: { display: false },
					title: {
						display: true,
						text: 'Consumption and kWh-price'
					},
					scales: {
						y: {
        					type: 'linear',
							display: true,
							position: 'left',
							scaleLabel: {
        						display: true,
        						labelString: 'kWh'
      						}
						},
						y1: {
					    	type: 'linear',
					        display: true,
					        position: 'right',
							scaleLabel: {
        						display: true,
        						labelString: 'pris'
      						},
					        // grid line settings
					        grid: {
								drawOnChartArea: false, // only want the grid lines for one axis to show up
        					}
						}
					}
				}
			});
			//alert("totalCost: "+ totalCost+", avgCostPerConsumedkWh: "+avgCostPerConsumedkWh+", avgCostPerkWh: "+avgCostPerkWh);
		}