/**
 * Author: Francesco Schwarz
 * Author URI: http://frncs.co/
 *
 * Contributor: David Naber <kontakt@dnaber.de>
 * DATA API Documentation: http://www.pegelonline.wsv.de/webservice/guideRestapi
 * Highcharts Documentation: http://api.highcharts.com/highcharts
 */

$(function() {

	var options = {
		chart: {
			renderTo: 'container',
			type: 'spline'
		},
		series: [{}]
	};

	function convertToTimestamp(date) {
		return new Date( date ).getTime() / 1000;
	}

	function makeArray( arr ) {
		var result = [], date;

		for (var i = arr.length - 1; i >= 0; i--) {
			date = new Date(arr[i].timestamp);
			date.setHours(date.getHours() + 2);
			result[i] = [];
			result[i][0] = Date.parse(date);
			result[i][1] = arr[i].value / 100;
		}

		return result;
	}

	// always return given number with two digits
	function twoDigits(n){
		return n > 9 ? "" + n: "0" + n;
	}

	/**
	 * @param array data
	 * @param string location
	 */
	function renderData( data, location ) {
		var
			currentWaterLevel = data[data.length - 1].value/100,
			currentHour = twoDigits(new Date(data[data.length - 1].timestamp).getHours()),
			currentMinute = twoDigits(new Date(data[data.length - 1].timestamp).getMinutes()),
			yAxisPlotLines = [];

		//some hard coded facts for Dresden
		if ( 'DRESDEN' == location ) {

			yAxisPlotLines = [
				//HSW - höchst schiffbarer Wasserstand
				{
					color : '#CCCCCC',
					width : 2,
					value : 5.0,
					label : {
						text : 'HSW',
						x : 40
					},
					zIndex: 1
				},
				//MHW mittlerer höchststand
				{
					color : '#CCCCCC',
					width : 2,
					value : 5.74,
					label : {
						text : 'MHW (11/2000 – 10/2010)',
						x : 40
					},
					zIndex : 1
				},
				//HHW höchster wert
				{
					color : '#CCCCCC',
					width : 2,
					value : 9.4,
					label : {
						text : 'HHW (9,40m am 17.08.2002)',
						x : 40,
						y : 16
					},
					zIndex : 1
				}
				];
		}

		$( '#container' ).empty();
		$( '#container' ).highcharts('StockChart', {

			credits: {
				text  : 'Alle Angaben ohne Gewähr. Datenquelle: Wasser- und Schifffahrtsverwaltung des Bundes (WSV)',
				href  : 'http://www.pegelonline.wsv.de/',
				style : {
					fontSize : '1.3em',
				},
				position : {
					y : 0
				}
			},
			rangeSelector : {
				buttons: [{
					type: 'day',
					count: 1,
					text: '1T'
				}, {
					type: 'day',
					count: 3,
					text: '3T'
				}, {
					type: 'day',
					count: 5,
					text: '5T'
				}, {
					type: 'day',
					count: 10,
					text: '10T'
				}],
				selected : 2 //index des buttons im array oben
			},

			series : [{
				name : 'AAPL',
				data : makeArray(data),
				id: 'dataseries',
				tooltip: {
					valueDecimals: 2
				},
				type: 'spline'
			}],

			subtitle : {
				text: 'Letzter Messwert: <b>' + Highcharts.numberFormat(currentWaterLevel, 2, ',') + ' m</b> um <b>' + currentHour + ':' + currentMinute + ' Uhr</b>',
				y: 35
			},

			title : {
				text : 'Elbpegel in ' + location
			},

			tooltip : {
				formatter :  function() {
					var s = '';
					s += '<b>' + Highcharts.numberFormat(this.y, 2, ',') + ' m</b><br>';
					s += Highcharts.dateFormat('%A, %d.%m.%Y, %H:%M Uhr', this.x);
					return s;
				}
			},

			yAxis : {
				max : 9.5,
				labels : {
					formatter: function() {
						return this.value +' m';
					},
					step : 0
				},
				 plotLines: yAxisPlotLines
			}

		});
	}


	var
		defaultStation = 'DRESDEN',
		locationAPIURL = 'http://www.pegelonline.wsv.de/webservices/rest-api/v2/stations.json',
		urlSheme = "http://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/%STATION%/W/measurements.json",
		sourceURLSheme = "http://www.pegelonline.wsv.de/gast/stammdaten?pegelnr=%ID%",
		url = urlSheme.replace( /%STATION%/, defaultStation );

	Highcharts.setOptions({
		lang : {
			decimalPoint: ',',
			thousandsSep: '.',
			months : ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
			shortMonths : ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
			weekdays : ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
		}
	});

	//init the location switcher for locations on river elbe
	$.getJSON(
		locationAPIURL,
		function( data ) {
			var
				select = $( '<select/>' ),
				label  = $( '<label/>' ),
				link   = $( '<a/>' ),
				newOpt;

			link.text( 'Stammdaten' );
			link.attr( 'id', 'source-link' );
			select.attr( 'id', 'location' );
			label.attr( 'for', 'location' );
			label.text( 'Messpunkt ' );

			select.on(
				'change',
				function() {
					var
						self    = $( this ),
						station = self.val(),
						id      = self.find( "[value='" + station + "']" ).attr( 'data-id' ),
						newURL;

					newURL = urlSheme.replace( /%STATION%/, station );
					$( 'p.loading' ).show();
					$( '#container' ).hide();

					$( '#source-link' ).attr(
						'href',
						sourceURLSheme.replace( /%ID%/, id )
					);
					$.getJSON(
						newURL,
						function( data ) {
							$( 'p.loading' ).hide();
							$( '#container' ).show();
							renderData( data, station );
						}
					);
				}
			);
			for ( i in data ) {
				if ( data[ i ].water.shortname != 'ELBE' )
					continue;

				newOpt = $( '<option/>' );
				newOpt.text( data[ i ].longname );
				newOpt.attr( 'value', data[ i ].shortname );
				newOpt.attr( 'data-id', data[ i ].number );
				if ( data[ i ].shortname == defaultStation ) {
					newOpt.attr( 'selected', 'selected' );
					link.attr(
						'href',
						sourceURLSheme.replace( /%ID%/, data[ i ].number )
					);
				}
				select.append( newOpt );
			}

			$( '#location-select' )
				.append( label )
				.append( select )
				.append( $( '<p/>' ).append( link ) );
		}
	);

	//load initial data
	$.getJSON(url, function(data) {
		$( "p.loading" ).hide();
		renderData( data, defaultStation );
	});

});
