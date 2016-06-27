(function( $ ) {
	var rAFPollyfill = function(callback){
		var currTime = new Date().getTime(),
			lastTime,
			timeToCall = Math.max(0, 16 - (currTime - lastTime)),
			id = setTimeout(function() { callback(currTime + timeToCall); }, timeToCall)
		;
		lastTime = currTime + timeToCall;
		return id;
	};

	var rgba_to_rba = function(color){
		if( Upfront && Upfront.Util  ) // If we are in editor then delegate to Upfront.Util.colors.rgba_to_rgb
			return Upfront.Util.colors.rgba_to_rgb( color );

		return color.replace(/ /g,'').replace(/^rgba\((\d+)\,(\d+)\,(\d+)\,(\d+\.?\d+?)\)$/, "rgb($1, $2, $3)");
	};
	var requestAnimationFrame =
			$.proxy(window.requestAnimationFrame, window) ||
			$.proxy(window.webkitRequestAnimationFrame, window) ||
			$.proxy(window.mozRequestAnimationFrame, window) ||
			$.proxy(window.oRequestAnimationFrame, window) ||
			$.proxy(window.msRequestAnimationFrame, window) ||
			rAFPollyfill
		;
	
	$.fn.uparallax = function (args) {
		var isMethod = typeof args === 'string',
			callArgs = isMethod ? Array.prototype.slice.call(arguments, 1) : [],
			result
		;

		this.each(function () {
			var $el = $(this),
				object = $el.data('uparallax')
			;

			if (object) {
				if (isMethod) {
					result = object.callMethod(args, callArgs);
				}
			}
			else {
				if (isMethod) {
					$.error('Can\'t call the method ' + args + '. The object is not initialized');
				}
				else {
					// Initialize object
					args.bgColor = rgba_to_rba( $el.parent().css("background-color") );
					$el.data('uparallax', new Upfront_Parallax($el, args));
				}
			}
		});

		if (this.length == 1 & typeof result != 'undefined') {
			return result;
		}
		return this;
	};
	
	var Upfront_Parallax = function ($el, args) {
		var me = this,
			data = $.extend({
				autostart: true,
				element: '',
				effect: 'scroll', // Available: scroll, rotate, scale, opacity
				movement: 30, // px
				rotation: 15, // degrees
				scaling: 1.1,
				opacity: 0.5,
				renderer: this.getDefaultRenderer(), // Available: canvas, absolute, fixed,
				overflowTop: 100, // px, render more than the background height to prevent artifact on late refresh
				overflowBottom: 100, // px, render more than the background height to prevent artifact on late refresh
				bgColor: "#fff"
			}, args)
		;
		this.opts = data;
		this.$parent = $el.parent();
		this.$element = $el;
		this.$moveElement = typeof this.opts.element === 'string' ? $el.find(this.opts.element) : this.opts.element;
		
		Upfront_Parallax.id++;
		this.id = Upfront_Parallax.id;
		Upfront_Parallax.instances[this.id] = this;
		
		if (this.opts.autostart) {
			this.start();
		}
	}
	
	// Static ID
	Upfront_Parallax.id = 0;
	Upfront_Parallax.instances = {};
	Upfront_Parallax.prevTime = 0;
	Upfront_Parallax.started = false;
	Upfront_Parallax.cache = {
		lastScrollTop: -1,
		scrollTop: 0,
		winHeight: 0,
		scrollBottom: 0
	};
	Upfront_Parallax.canvas = false;
	Upfront_Parallax.context = false;
	Upfront_Parallax.start = function () {
		if (Upfront_Parallax.started) return;
		Upfront_Parallax.started = true;
		Upfront_Parallax.draw();
	}
	Upfront_Parallax.draw = function (time) {
		var scrollTop = Upfront_Parallax.cache.scrollTop;
		if (
			Upfront_Parallax.cache.lastScrollTop == scrollTop
			&&
			time - Upfront_Parallax.prevTime < 5000 // Re-draw every 5 second
		) {
			requestAnimationFrame(Upfront_Parallax.draw);
			return;
		}
		var winHeight = $(window).height(),
			scrollBottom = Math.round(scrollTop + winHeight);
		Upfront_Parallax.cache.lastScrollTop = scrollTop;
		Upfront_Parallax.cache.winHeight = winHeight;
		Upfront_Parallax.cache.scrollBottom = scrollBottom;
		
		for (id in Upfront_Parallax.instances) {
			Upfront_Parallax.instances[id].draw(time);
		}
		Upfront_Parallax.prevTime = time;
		requestAnimationFrame(Upfront_Parallax.draw);
	}
	Upfront_Parallax.updateScroll = function (e) {
		var scrollTop = window.pageYOffset;
		Upfront_Parallax.cache.scrollTop = scrollTop;
	}
	$(window).one('load.upfront_paralax', Upfront_Parallax.updateScroll);
	$(window).on('load.upfront_paralax', Upfront_Parallax.draw);
	$(window).on('scroll.upfront_paralax', Upfront_Parallax.updateScroll);
	
	Upfront_Parallax.prototype = {
		cache: {},
		canvas: false,
		context: false,
		imgCanvas: false,
		imgContext: false,
		callMethod: function (method, args) {
			switch (method) {
				case 'start':
					this.start();
					break;
				case 'stop':
					this.stop();
					break;
				case 'destroy':
					this.destroy();
					break;
				case 'refresh':
					this.refresh();
					break;
				case 'setOption':
					this.setOption(args[0], args[1]);
					break;
				case 'setEffect':
					this.setOption('effect', args[0]);
					break;
				case 'setMovement':
					this.setOption('movement', args[0]);
					break;
				case 'setOpacity':
					this.setOption('opacity', args[0]);
					break;
				case 'setRotation':
					this.setOption('rotation', args[0]);
					break;
				case 'setScaling':
					this.setOption('scaling', args[0]);
					break;
			}
		},
		bindEvents: function () {
			//$(window).on('scroll.upfront_parallax_' + this.id, $.proxy(this.update, this));
			$(window).on('load.upfront_parallax_' + this.id, $.proxy(this.refresh, this));
			$(window).on('resize.upfront_parallax_' + this.id, $.proxy(this.refresh, this));
		},
		unbindEvents: function () {
			//$(window).off('scroll.upfront_parallax_' + this.id);
			$(window).off('load.upfront_parallax_' + this.id);
			$(window).off('resize.upfront_parallax_' + this.id);
		},
		setOption: function (option, value) {
			this.opts[option] = value;
			this.refresh();
		},
		getDefaultRenderer: function () {
			return 'canvas';
		},
		start: function () {
			this.$element.addClass('upfront-parallax');
			this.$moveElement.addClass('upfront-parallax-element');
			this.reset_cache();
			if ('fixed' == this.opts.renderer) {
				this.prepareFixedPos();
			}
			else if ('canvas' == this.opts.renderer) {
				this.prepareCanvas();
			}
			this.refresh();
			this.bindEvents();
			Upfront_Parallax.start();
		},
		stop: function () {
			this.$element.removeClass('upfront-parallax');
			this.$moveElement.removeClass('upfront-parallax-element');
			if ('fixed' == this.opts.renderer) {
				this.restorePos();
			}
			else if ('canvas' == this.opts.renderer) {
				this.removeCanvas();
			}
			this.reset();
			this.unbindEvents();
		},
		reset_cache: function() {
			this.cache = {
				translate: 0,
				offsetTop: 0,
				offsetBottom: 0,
				offsetLeft: 0,
				height: 0,
				width: 0,
				visible: true,
				img: false,
				imgCanvas: false,
				imgContext: false
			};
		},
		reset: function () {
			this.$moveElement.css({
				transform: '',
				opacity: '',
				top: '',
				bottom: ''
			});
		},
		destroy: function () {
			this.stop();
			delete Upfront_Parallax.instances[this.id];
			this.$element.removeData('uparallax');
		},
		prepareFixedPos: function () {
			this.$element.css({
				position: 'fixed',
				top: 0,
				left: 0,
				//transform: 'translate3d(0,0,0)',
				//backfaceVisibility: 'hidden'
			});
		},
		restorePos: function () {
			this.$element.css({
				position: '',
				top: '',
				left: '',
				transform: '',
				//backfaceVisibility: ''
			});
		},
		prepareCanvas: function () {
			if (this.canvas === false) {
				this.canvas = document.createElement('canvas');
				this.canvas.id = 'uparallax-' + this.id;
				$(this.canvas).css({
					position: 'fixed',
					top: 0,
					left: 0,
					zIndex: -1,
					display: 'block',
					pointerEvents: 'none'
				});
				$('.upfront-output-layout, .upfront-layout').append(this.canvas);
			}
			this.context = this.canvas.getContext('2d');
			if( this.is_image_png() )
				this.context.fillStyle = this.opts.bgColor;
			this.updateCanvas();
		},
		updateCanvas: function () {
			if (this.canvas === false) return;
			this.canvas.width = $(window).width();
			this.canvas.height = $(window).height();
		},
		removeCanvas: function () {
			// this.canvas.remove(); // This does not work on IE11 and crash the UF editor
			$(this.canvas).remove();
		},
		prepareImage: function () {
			if (this.cache.img) {
				if (!this.imgCanvas) this.renderImage();
				this.$element.css('display', 'none');
				return;
			}
			var me = this,
				img = new Image,
				src = this.$moveElement.css('background-image').replace(/^url\(\s*['"]?\s*/, '').replace(/\s*['"]?\s*\)$/, '')
			;
			if (src != 'none') {
				this.cache.img = img;
				this.cache.background_color = this.$parent.css("background-color") || "#fff";
				img.src = src;
				this.$element.css('display', 'none');
				this.$parent.css({
					background: 'none'
				});
			}
		},
		renderImage: function () {
			if (!this.cache.img) return;
			if (!this.imgCanvas) {
				this.imgCanvas = document.createElement('canvas');
				$(this.imgCanvas).css({
					display: 'block'
				});

				this.imgContext = this.imgCanvas.getContext('2d', {alpha: false});
			}
			var width = this.cache.width,
				height = this.cache.height,
				parallaxHeight = height + (this.movementOffset*2),
				winHeight = Upfront_Parallax.cache.winHeight,
				ratio = this.cache.img.height/this.cache.img.width,
				imgWidth = width,
				imgHeight = parallaxHeight,
				imgY = 0,
				drawWidth = 0,
				drawHeight = 0,
				drawX = 0,
				drawY = 0
			;
			this.imgCanvas.width = width;
			this.imgCanvas.height = parallaxHeight;
			if (parallaxHeight/width > ratio) {
				imgWidth = parallaxHeight/ratio;
				drawWidth = Math.floor(width/imgWidth * this.cache.img.width);
			}
			else {
				imgHeight = width*ratio;
				drawWidth = this.cache.img.width;
			}
			imgY = (height-imgHeight) / 2;
			drawHeight = Math.floor(parallaxHeight/imgHeight * this.cache.img.height);
			drawX = (this.cache.img.width - drawWidth) / 2;
			drawY = (this.cache.img.height - drawHeight) / 2;

			if( this.is_image_png() ) {
				this.fillCanvas(width, parallaxHeight);
			}

			this.imgContext.drawImage(this.cache.img, drawX, drawY, drawWidth, drawHeight, 0, 0, width, parallaxHeight);

		},
		refresh: function () {
			this.refreshCache();
			var height = this.cache.height,
				winHeight = $(window).height(),
				heightOff =  Math.round((winHeight - height) / 2)
			;
			if (heightOff - this.opts.movement > this.opts.movement) {
				this.movementOffset = heightOff - this.opts.movement;
			}
			else {
				this.movementOffset = this.opts.movement;
			}
			/*
			 * this.$moveElement must have position absolute, with top and bottom set to 0 initially, height auto
			 * */
			this.$moveElement.css({
				top: this.movementOffset*-1,
				bottom: this.movementOffset*-1
				//height: height+this.movementOffset*2
			});
			if ('fixed' == this.opts.renderer) {
				this.$element.css({
					left: this.cache.offsetLeft,
					height: this.cache.height,
					width: this.cache.width
				});
			}
			else if ('canvas' == this.opts.renderer) {
				this.updateCanvas();
				this.renderImage();
			}
			this.update();
		},
		refreshCache: function () {
			var offset = this.$parent.offset(),
				height = this.$parent.height(),
				width = this.$parent.width()
			;
			this.cache.offsetTop = offset.top;
			this.cache.offsetBottom = offset.top + height;
			this.cache.offsetLeft = offset.left;
			this.cache.height = height;
			this.cache.width = width;
		},
		update: function () {
			requestAnimationFrame($.proxy(this.draw, this));
		},
		draw: function (time) {
			if ( !(this.id in Upfront_Parallax.instances) ) return;
			var offsetTop = this.cache.offsetTop,
				offsetBottom = this.cache.offsetBottom,
				height = this.cache.height,
				scrollTop = Upfront_Parallax.cache.scrollTop,
				scrollBottom = Upfront_Parallax.cache.scrollBottom,
				winHeight = Upfront_Parallax.cache.winHeight,
				moveHeight = (this.movementOffset * 2) + (this.opts.movement * 2),
				range = 2 * this.movementOffset,
				movement = (this.movementOffset > 0 ? range / moveHeight : 1),
				translate = Math.round(movement * (scrollBottom - offsetTop - height)) - this.movementOffset,
				maxTranslate = Math.round(movement * (winHeight)) - this.movementOffset,
				minTranslate = maxTranslate*-1,
				effects = this.opts.effect.split(','),
				transform = ''
			;
			if ('canvas' == this.opts.renderer) {
				this.prepareImage();
				if (!this.cache.img) return;
			}
			if (offsetBottom > scrollTop && offsetTop < scrollBottom) {
				if ('fixed' == this.opts.renderer) {
					if (!this.cache.visible) {
						this.$element.css('visibility', 'visible');
					}
					this.$element.css({
						//transform: 'translate3d(0, ' + (offsetTop-scrollTop) + 'px, 0)'
						transform: 'translateY(' + (offsetTop-scrollTop) + 'px)'
					});
				}
				this.cache.visible = true;
			}
			else {
				if (this.cache.visible) {
					if ('fixed' == this.opts.renderer) {
						this.$element.css({
							visibility: 'hidden',
							//transform: 'translate3d(0, ' + winHeight + 'px, 0)'
							//transform: 'translateY(' + winHeight + 'px)'
						});
					}
					else if ('canvas' == this.opts.renderer) {
						this.clearCanvas();
					}
					this.cache.visible = false;
				}
			}
			if (translate > maxTranslate) {
				translate = maxTranslate;
			}
			else if (translate < minTranslate) {
				translate = minTranslate;
			}
			
			if (!this.cache.visible) return;
			this.cache.translate = translate;
			
			if ('canvas' == this.opts.renderer) {
				this.drawCanvas(translate, maxTranslate);
			}
			else {
				for (i in effects) {
					var effect = this.getEffect(effects[i], translate, maxTranslate);
					if (effect.property == 'transform') {
						transform += (transform == '' ? '' : ' ');
						transform += effect.value;
					}
					else {
						this.$moveElement.css(effect.property, effect.value);
					}
				}
				if (transform !== '') {
					this.$moveElement.css('transform', transform);
				}
			}
		},
		drawCanvas: function (translate, maxTranslate) {
			if (!this.cache.img || !this.imgCanvas) return;
			var offsetTop = this.cache.offsetTop,
				offsetBottom = this.cache.offsetBottom,
				offsetLeft = this.cache.offsetLeft,
				width = this.cache.width,
				height = this.cache.height,
				parallaxHeight = height + (this.movementOffset*2),
				scrollTop = Upfront_Parallax.cache.scrollTop,
				scrollBottom = Upfront_Parallax.cache.scrollBottom,
				winHeight = Upfront_Parallax.cache.winHeight,
				visibleHeight = height,
				ratio = this.cache.img.height/this.cache.img.width,
				imgWidth = width,
				imgHeight = parallaxHeight,
				imgY = 0,
				drawWidth = 0,
				drawHeight = 0,
				drawVisibleHeight = 0,
				drawX = 0,
				drawY = 0,
				drawRelY = 0,
				closest = this.findClosestInstances(),
				clearTop = offsetTop,
				clearBottom = offsetBottom
			;
			if (offsetTop < scrollTop) {
				visibleHeight = offsetBottom - scrollTop;
			}
			else if (offsetBottom > scrollBottom) {
				visibleHeight = scrollBottom - offsetTop;
			}
			visibleHeight = Math.min(winHeight, visibleHeight);
			drawY = (parallaxHeight > height ? Math.round((parallaxHeight - height) / 2) : 0);
			if (offsetTop < scrollTop) {
				drawRelY = scrollTop - offsetTop;
				drawY += drawRelY;
			}

			drawY += translate * -1;
			if (closest.top && closest.top.cache.offsetBottom < offsetTop) {
				clearTop -= Math.min(this.opts.overflowTop, Math.ceil((offsetTop - closest.top.cache.offsetBottom) / 2));
			}
			else if (!closest.top) {
				clearTop -= this.opts.overflowTop;
			}
			if (closest.bottom && closest.bottom.cache.offsetTop > offsetBottom) {
				clearBottom += Math.min(this.opts.overflowBottom, Math.floor((closest.bottom.cache.offsetTop - offsetBottom) / 2));
			}
			else if (!closest.bottom) {
				clearBottom += this.opts.overflowBottom;
			}

			//if( this.is_image_png() )
			//	this.fillCanvas(width, parallaxHeight);

			this.context.drawImage(this.imgCanvas, 0, 0, width, parallaxHeight, offsetLeft, offsetTop-this.movementOffset-scrollTop+translate, width, parallaxHeight);

			if (clearTop > scrollTop) {
				this.context.clearRect(offsetLeft, 0, width, clearTop-scrollTop);
			}
			if (winHeight > clearBottom-scrollTop) {
				this.context.clearRect(offsetLeft, clearBottom-scrollTop, width, winHeight-(clearBottom-scrollTop));
			}
		},
		/**
		 * Checks if image src image in png
		 * @returns {boolean|*|Array|{index: number, input: string}}
         */
		is_image_png: function(){
			return this.cache.img && this.cache.img.src && this.cache.img.src.toLowerCase().match(/.png/);
		},
		fillCanvas: function(width, parallaxHeight){
			this.imgContext.fillStyle = this.opts.bgColor;
			this.imgContext.rect(0, 0, width, parallaxHeight);
			this.imgContext.fill();
		},
		clearCanvas: function () {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		},
		findClosestInstances: function () {
			var current = false,
				closestTop = false,
				closestBottom = false
			;
			for (id in Upfront_Parallax.instances) {
				current = Upfront_Parallax.instances[id];
				if (current.id == this.id) continue;
				if (current.cache.offsetBottom <= this.cache.offsetTop) {
					if (closestTop !== false && closestTop.cache.offsetBottom > current.cache.offsetBottom) continue;
					closestTop = current;
				}
				else if (current.cache.offsetTop >= this.cache.offsetBottom) {
					if (closestBottom !== false && closestBottom.cache.offsetTop < current.cache.offsetTop) continue;
					closestBottom = current;
				}
			}
			return {
				top: closestTop,
				bottom: closestBottom
			}
		},
		getEffect: function (effect, translate, maxTranslate) {
			var property = 'transform',
				value = '',
				position = translate/maxTranslate
			;
			switch (effect) {
				case 'scroll':
					//value = 'translate3d(0, ' + translate + 'px, 0)';
					value = 'translateY(' + translate + 'px)';
					//property = 'margin-top';
					//value = translate;
					break;
				case 'rotate':
					value = 'rotate(' + (position*this.opts.rotation) + 'deg)';
					break;
				case 'scale':
					value = 'scale(' + (1 - ( (1-this.opts.scaling) * Math.abs(position) )) + ')';
					break;
				case 'opacity':
					property = 'opacity';
					value = 1 - ( (1-this.opts.opacity) * Math.abs(position) );
					break;
			}
			return {
				property: property,
				value: value
			};
		}
	};

}( jQuery ));