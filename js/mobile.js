const ENABLE_FULL_ANIMATION = true;
$(() => {
	if( ENABLE_FULL_ANIMATION == false ){
		const itemAr = new HeroItem({image:"assets/ravens-off.png", title:""});
		itemAr.$element.appendTo( $('body') );
		itemAr.$element.css({
			left : 0.5 * $("body").width(),
			top : 0.5 * $("body").height()
		});
		
		itemAr.show(() => {
			itemAr.$element.animate({
				state : 1
			},{
				progress : (evt, progress) => {
					itemAr.setProgress( progress );
				}
			});
		});
	
		itemAr.$element.on('click',() => {
			itemAr.setEnabled( true, () => {
				setTimeout( () => {
					itemAr.hide();
				}, 500 );
			});
		});
	}else{
		const timeDiff = 800
		const track = new Track();
		track.$element.appendTo( $('body') );
		track.show(() => {
			Delay( 2 * timeDiff, () => {
				const itemWikiB = new WikiItem({title:"",className:"empty"});
				itemWikiB.$element.appendTo( $('body') );
				const pnt = track.pointAt( 0.72 );
				itemWikiB.$element.css({
					left : pnt.x,
					top : pnt.y
				});
				itemWikiB.show();
			} );

			Delay( 1 * timeDiff, () => {
				console.log('delay 2');
				const itemWikiA = new WikiItem({title:"View"});
				itemWikiA.$element.appendTo( $('body') );
				const pnt = track.pointAt( 0.28 );
				itemWikiA.$element.css({
					left : pnt.x,
					top : pnt.y
				});
				itemWikiA.show();
			} )
			Delay( 0 * timeDiff, () => {
				//show the AR item
				const itemAr = new HeroItem({image:"assets/ravens-off.png", title:"Event Title"});
				itemAr.$element.appendTo( $('body') );
				const pnt = track.pointAt( 0.5 );
			
				itemAr.$element.css({
					left : pnt.x,
					top : pnt.y
				})
				itemAr.show(() => {
					itemAr.$element.animate({
						state: 1
					}, {
						progress : ( evt, progress ) => {
							itemAr.setProgress( progress );
							//also update the track to show this section
							track.setHighlight(0.28, 0.28 + progress * (0.5 - 0.28) );
						}, 
						complete : () => {
							setTimeout(() => {
								itemAr.setEnabled( true, () => {
									console.log('Enabled');
								});
							}, 10 );
						},
						duration : 5000
					});
				});
			} )
			
			return;
		});

		//add the start station
		Delay( 1, () => {
			console.log('delay 1');
			const itemStationA = new StationItem( {title:"Start"} );
			const pnt = track.pointAt( 0.08 );
			itemStationA.$element.appendTo( $('body') ).css({
				left : pnt.x,
				top : pnt.y
			});
			itemStationA.show();
		} )

		Delay( 2 * timeDiff, () => {
			//add stationB
			const itemStationB = new StationItem( {title:"End"} );
			const pnt = track.pointAt( 0.87 );
			itemStationB.$element.appendTo( $('body') ).css({
				left : pnt.x,
				top : pnt.y
			});

			itemStationB.show();
		} );
	}
	
})


function Delay( time, handler ){
	setTimeout( handler, time );
}

//A DIRTY MIXER FUNCTION TO GIVE ME SHAPED ANIMATION CURVES
function GetValue( progress, steps ){
	for( var i = 1; i < steps.length; i++  ){
		const step1 = steps[i - 1];
		const step2 = steps[i];

		if( progress >= step1[0] && progress <= step2[0] ){
			const r = (progress - step1[0]) / ( step2[0] - step1[0] );
			return step1[1] + r * ( step2[1] - step1[1] ); 
		}
	}

	return 0;
}

//USE HANDLEBAR TO CREATE A HTML SNIPPET FROM A TEMPLATE AND SOME DATA
function CreateElementTemplate( id, data ){
	return Handlebars.compile( $( id ).html() )( data );
}

//COMMON ANIMATION FOR REVEALNG AN ELEMENT
function OpenElement( $element, onComplete ){
	var $content = $element.find('.content');
	
	$element.show().animate({
		state : 1
	},{
		progress : ( evt, progress ) => {
			$content.css({
				opacity : GetValue(progress,[[0,0],[0.9,1],[1,1]]),
				transform : 'scale('+GetValue(progress,[[0,0],[0.9,1.2],[1,1]])+') rotateY('+Math.round( progress * 720 )+'deg)'
			})
		},
		complete : onComplete,
		duration : 700
	})
}

//COMMON ANIMATION FOR HIDING AN ELEMENT
function CloseElement( $element, onComplete ){
	var $content = $element.find('.content');

	$element.animate({
		state : 1
	},{
		progress : ( evt, progress ) => {
			$content.css({
				opacity : 1 - progress,
				transform : 'scale('+Math.pow(1 - progress, 2)+') rotateY('+Math.round( progress * 360 )+'deg)'
			})
		},
		complete : onComplete,
		duration : 650
	});
}

//DRAW INSTANCE OF CURVE TO CONTEXT
function DrawCurve( ctx, curve ){
	ctx.moveTo( 
		curve.p1.x, curve.p1.y 
	);

	if( curve.cp2 ){
		ctx.bezierCurveTo( 
			curve.cp1.x, curve.cp1.y,
			curve.cp2.x, curve.cp2.y,
			curve.p2.x, curve.p2.y 
		);
	}else{
		ctx.quadraticCurveTo( 
			curve.cp1.x, curve.cp1.y,
			curve.p2.x, curve.p2.y 
		);
	}
}

/**TRACK
 * BACKGROUND LINE EFFECT
 */
function Track( data, options ){
	const element = CreateElementTemplate(`#template-track`,data); 
	this.$element = $( element );
	this.state = {
		progress : 0
	}

	this.redraw();
}

Track.prototype.show = function( onComplete ){
	
	this.$element.attr({
		width: this.$element.width(),
		height: this.$element.height(),
	})
	.hide()
	.fadeIn()
	.animate({state:1},{
		progress : ( evt, progress ) => {
			this.setState({progress:progress});
		},
		complete : onComplete,
		duration : 2000
	});
	
	this.initCurve();
	this.redraw();
}

Track.prototype.initCurve = function(){
	var canvas = this.$element[0];
	var width = canvas.width;
	var height = canvas.height;

	this.curveA = createBezierQuadratic( 0.5 * width - 100, -10, 0.5 * width, 0.25 * height, 0.5 * width, 0.5 * height );
	this.curveB = createBezierQuadratic( 0.5 * width, 0.5 * height, 0.5 * width, 0.75 * height, 0.5 * width - 100, height + 10 );
}

Track.prototype.pointAt = function( position ){
	if( !this.curveA || !this.curveB ){
		return null;
	}else{
		if( position <= 0.5 ){
			return this.curveA.pointAt( position * 2 );
		}else{
			return this.curveB.pointAt( (position - 0.5) * 2 );
		}
	}
}

Track.prototype.redraw = function(){
	var canvas = this.$element[0];
	var width = canvas.width;
	var height = canvas.height;

	var state = this.state;
	
	var ctx = canvas.getContext('2d');

	ctx.clearRect( 0, 0, width, height );

	if( !this.curveA || !this.curveB ){
		return;
	}
	
	//ctx.setLineDash([5, 3]);
	ctx.strokeStyle = "#ccc";
	ctx.lineWidth = 10;
	ctx.beginPath();
	DrawCurve( ctx, this.curveA );
	DrawCurve( ctx, this.curveB );
	ctx.stroke();
	
	ctx.strokeStyle = "#fff";
	ctx.lineWidth = 10;

	if( state.progress < 0.5 ){
		let curveA = this.curveA.splitAt( 2 * state.progress, true );
		ctx.beginPath();
		DrawCurve( ctx, curveA );
		ctx.stroke();
	}else{
		let curveB = this.curveB.splitAt( 2 * (state.progress - 0.5), true );
		ctx.beginPath();
		DrawCurve( ctx, this.curveA );
		DrawCurve( ctx, curveB );
		ctx.stroke();
	}

	if( state.highlight ){
		let curveA = this.curveA.splitAt( 2 * state.highlight.start, false );
		curveA = curveA.splitAt( (state.highlight.end - state.highlight.start) / ( ( 0.5 - state.highlight.start ) ), true );
		ctx.strokeStyle = "#672C78";
		ctx.beginPath();
		DrawCurve( ctx, curveA );
		ctx.stroke();
	}
}

Track.prototype.setHighlight = function( start, end ){
	this.setState({
		highlight: {
			start:start,
			end: end
		}
	})
}

Track.prototype.setState = function( update ){
	let changed = false;
	const state = this.state;
	for( var id in update ){
		if( state[ id ] != update[ id ] ){
			state[ id ] = update[id];
			changed = true;
		}
	}

	if( changed ){
		this.state = state;
		this.redraw();
	}
}

/**ARITEM */
function HeroItem( data ){

	const element = CreateElementTemplate(`#template-ar-item`,data); 
	
	//prepare the image
	this.enabled = false;
	this.state = {
		progress : 0,
		fill : 0
	};

	this.image = new Image();
	this.image.onload = () => {
		this.image.loaded = true;
		this.redraw();
	};
	this.image.src = data.image;
	//prepare the html
	this.$element = $(element).hide();
	this.$canvas = this.$element.find('canvas');

	this.redraw();
}

HeroItem.prototype.setProgress = function( progress ){
	if( this.state.progress != progress ){
		this.setState({progress:progress});
	}
}

HeroItem.prototype.setEnabled = function( enabled, onComplete ){
	if( this.enabled != enabled ){
		this.enabled = enabled;
		//animate the change of state
		this.$element.animate({
			state: 1
		}, {
			progress : ( evt, progress ) => {
				this.setState( {fill:progress} );
			},
			complete : onComplete,
			duration : 500
		});
	}
}

HeroItem.prototype.setState = function( update ){
	let changed = false;
	const state = this.state;
	for( var id in update ){
		if( state[ id ] != update[ id ] ){
			state[ id ] = update[id];
			changed = true;
		}
	}

	if( changed ){
		this.state = state;
		this.redraw();
	}
}

HeroItem.prototype.redraw = function(){
	var canvas = this.$canvas[0];
	var width = canvas.width;
	var height = canvas.height;

	var state = this.state;
	
	var ctx = canvas.getContext('2d');

	ctx.clearRect( 0, 0, width, height );


	var gradient = ctx.createLinearGradient(0, 0, 200, 200);
	gradient.addColorStop("0", "#672C78");
	gradient.addColorStop("1.0", "#D5658E");

	// Fill with gradient
	ctx.strokeStyle = gradient;
	
	let radius = 69;
	let outer = radius + 5;
	let inner = radius - 5;
	let expansion = 0;
	
	if( state.fill > 0 ){
		expansion = 8 * Math.sin( Math.min( 1, 2 * state.fill ) * Math.PI );
		
		outer = radius + 5 + expansion;
		inner = radius - 5 - 2 * Math.max(0, state.fill - 0.5) * ( radius - 5 );
	}
	
	//console.log( outer, inner );
	
	ctx.fillStyle = '#d2d1d7';
	ctx.beginPath();
	ctx.arc( 0.5*width, 0.5*height, radius, 0, 2 * Math.PI );
	ctx.fill();
	
	ctx.lineWidth = outer - inner;
	ctx.beginPath();
	ctx.arc( 0.5*width, 0.5*height, 0.5 * (outer + inner), -0.5 * Math.PI, -0.5 * Math.PI + state.progress * 2 * Math.PI );
	ctx.stroke();
	
	//draw on to the canvas
	if( this.image.loaded ){
		ctx.drawImage( this.image, 0, 0, this.image.width, this.image.height, -expansion, -expansion, width + 2 * expansion, height + 2 * expansion );
	}	
}

HeroItem.prototype.show = function(onComplete){
	var $content = this.$element.find('.content');
	
	this.$element.show().animate({
		state : 1
	},{
		progress : ( evt, progress ) => {
			$content.css({
				opacity : GetValue(progress,[[0,0],[0.5,0.5],[0.9,1],[1,1]]),
				transform : 'scale('+GetValue(progress,[[0,0.5],[0.9,1.2],[1,1]])+') rotateY('+Math.round( 180 * ( 1 - progress ) )+'deg)'
			})
		},
		complete : onComplete,
		duration : 350
	})
	
	this.$canvas.attr({
		width: this.$canvas.width(),
		height: this.$canvas.height(),
	});

	this.redraw();
}

HeroItem.prototype.hide = function(  onComplete ){
	CloseElement( this.$element, onComplete );
}


/**StationItem */
function StationItem( data ){
	
	const element = CreateElementTemplate(`#template-station-item`,data); 
	
	//prepare the image
	this.enabled = false;
	this.state = {
		fill: 0
	};
	
	
	//prepare the html
	this.$element = $(element);
	this.$canvas = this.$element.find('canvas');
	//inital call to draw
	this.redraw();
}

StationItem.prototype.setState = function( update ){
	let changed = false;
	const state = this.state;
	for( var id in update ){
		if( state[ id ] != update[ id ] ){
			state[ id ] = update[id];
			changed = true;
		}
	}
	
	if( changed ){
		this.state = state;
		this.redraw();
	}
}

StationItem.prototype.redraw = function(){
	var canvas = this.$canvas[0];
	var width = canvas.width;
	var height = canvas.height;
	
	var state = this.state;
	
	var ctx = canvas.getContext('2d');
	
	ctx.clearRect( 0, 0, width, height );
	
	
	var gradient = ctx.createLinearGradient(0, 0, 200, 200);
	gradient.addColorStop("0", "#672C78");
	gradient.addColorStop("1.0", "#D5658E");
	
	let radius = 45;
	// Fill with gradient
	ctx.strokeStyle = "white";
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.arc( 0.5*width, 0.5*height, radius, -0.5 * Math.PI, -0.5 * Math.PI + 1 * 2 * Math.PI );
	ctx.stroke();
	
	
	if( state.fill > 0 ){
		ctx.beginPath();
		ctx.strokeStyle = "#EBEAED";
		ctx.lineWidth = Math.min( 1, 2 * state.fill ) * 0.3 * radius;
		ctx.arc( 0.5*width, 0.5*height, 0.55 * radius, -0.5 * Math.PI, -0.5 * Math.PI + 1 * 2 * Math.PI );
		ctx.stroke();
		
		
		ctx.strokeStyle = "white";
		var r = Math.min( ( 2 * state.fill), 1 );
		
		if( r > 0 ){
			ctx.lineWidth = r * 0.4 * radius;;
			ctx.beginPath();
			ctx.arc( 0.5*width, 0.5*height, (0.2 * r) * radius, -0.5 * Math.PI, -0.5 * Math.PI + 1 * 2 * Math.PI );
			ctx.stroke();
		}
		
	}
	
	this.$element.find('.title').css({opacity:state.fill});
	
	
}

StationItem.prototype.show = function( onComplete ){
	OpenElement(this.$element,() => {
		this.$element.animate({
			state: 1
		}, {
			progress : ( evt, progress ) => {
				this.setState( {fill:progress} );
			},
			complete : onComplete,
			duration : 500
		});
	});

	this.$canvas.attr({
		width: this.$canvas.width(),
		height: this.$canvas.height(),
	});
	
	this.redraw();
}

StationItem.prototype.hide = function(){
	CloseElement( this.$element, onComplete );
}


/**WikiItem */
function WikiItem( data, options ){
	this.options = options || {};

	const element = CreateElementTemplate(`#template-wiki-item`,data); 
	
	//prepare the image
	this.enabled = false;
	this.state = {
		fill: 0
	};


	//prepare the html
	this.$element = $(element);
	this.$canvas = this.$element.find('canvas');
	//inital call to draw
	this.redraw();
}

WikiItem.prototype.show = function( onComplete ){
	this.$element.hide().fadeIn(() => {
		this.$element.animate({
			state: 1
		}, {
			progress : ( evt, progress ) => {
				this.setState( {fill:progress} );
			},
			complete : onComplete,
			duration : 500
		});
	});

	this.$canvas.attr({
		width: this.$canvas.width(),
		height: this.$canvas.height(),
	});

	this.redraw();
}

WikiItem.prototype.setState = function( update ){
	let changed = false;
	const state = this.state;
	for( var id in update ){
		if( state[ id ] != update[ id ] ){
			state[ id ] = update[id];
			changed = true;
		}
	}

	if( changed ){
		this.state = state;
		this.redraw();
	}
}

WikiItem.prototype.redraw = function(){
	var canvas = this.$canvas[0];
	var width = canvas.width;
	var height = canvas.height;

	var state = this.state;
	
	var ctx = canvas.getContext('2d');

	ctx.clearRect( 0, 0, width, height );

	this.$element.find('.title').css({opacity:state.fill});	
}

WikiItem.prototype.remove = function(){
	CloseElement( this.$element, () => {
		this.$element.remove();
		this.onRemove();
	} );
}

WikiItem.prototype.onRemove = function(){
	let onRemove = this.options.onRemove;
	onRemove = typeof onRemove == 'function' ? onRemove : () => {
		console.log('onRemove not implemented');
	};
	onRemove();
}

