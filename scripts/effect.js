(function( $ ) {
	var rAFPollyfill = function(callback){
		var currTime = new Date().getTime(),
			timeToCall = Math.max(0, 16 - (currTime - lastTime)),
			id = setTimeout(function() { callback(currTime + timeToCall); }, timeToCall)
		;
		lastTime = currTime + timeToCall;
		return id;
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
				opacity: 0.5
			}, args)
		;
		this.opts = data;
		this.$parent = $el;
		this.$element = typeof this.opts.element === 'string' ? $el.find(this.opts.element) : this.opts.element;
		
		Upfront_Parallax.id++;
		this.id = Upfront_Parallax.id;
		Upfront_Parallax.instances[this.id] = this;
		
		this.start();
	}
	
	// Static ID
	Upfront_Parallax.id = 0;
	Upfront_Parallax.instances = {};
	Upfront_Parallax.prevTime = 0;
	Upfront_Parallax.cache = {
		scrollTop: 0,
		winHeight: 0,
		scrollBottom: 0
	};
	Upfront_Parallax.start = function () {
		Upfront_Parallax.draw();
	}
	Upfront_Parallax.draw = function (time) {
		var scrollTop = $('body').scrollTop();
		if (Upfront_Parallax.cache.scrollTop == scrollTop) {
			requestAnimationFrame(Upfront_Parallax.draw);
			return;
		}
		console.time('parallax draw');
		var winHeight = $(window).height(),
			scrollBottom = Math.round(scrollTop + winHeight);
		Upfront_Parallax.cache.scrollTop = scrollTop;
		Upfront_Parallax.cache.winHeight = winHeight;
		Upfront_Parallax.cache.scrollBottom = scrollBottom;
		
		for (id in Upfront_Parallax.instances) {
			Upfront_Parallax.instances[id].draw(time);
		}
		Upfront_Parallax.prevTime = time;
		console.timeEnd('parallax draw');
		requestAnimationFrame(Upfront_Parallax.draw);
	}
	
	Upfront_Parallax.prototype = {
		cache: {},
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
			$(window).on('resize.upfront_parallax_' + this.id, $.proxy(this.refreshCache, this));
		},
		unbindEvents: function () {
			//$(window).off('scroll.upfront_parallax_' + this.id);
			$(window).off('resize.upfront_parallax_' + this.id);
		},
		setOption: function (option, value) {
			this.opts[option] = value;
			this.refresh();
		},
		start: function () {
			this.$parent.addClass('upfront-parallax');
			this.$element.addClass('upfront-parallax-element');
			this.reset_cache();
			this.refresh();
			this.bindEvents();
			// Start parallax draw when needed
			if (Upfront_Parallax.prevTime == 0) {
				Upfront_Parallax.start();
			}
		},
		stop: function () {
			this.$parent.removeClass('upfront-parallax');
			this.$element.removeClass('upfront-parallax-element');
			this.reset();
			this.unbindEvents();
		},
		reset_cache: function() {
			this.cache = {
				translate: 0,
				offsetTop: 0,
				height: 0
			};
		},
		reset: function () {
			this.$element.css({
				transform: '',
				opacity: ''
			});
		},
		destroy: function () {
			this.stop();
			delete Upfront_Parallax.instances[this.id];
			this.$parent.removeData('uparallax');
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
			 * this.$element must have position absolute, with top and bottom set to 0 initially, height auto
			 * */
			this.$element.css({
				top: this.movementOffset*-1,
				//bottom: this.movementOffset*-1
				height: height+this.movementOffset*2
			});
			this.update();
		},
		refreshCache: function () {
			var offset = this.$parent.offset(),
				height = this.$parent.height()
			;
			this.cache.offsetTop = offset.top;
			this.cache.height = height;
		},
		update: function () {
			requestAnimationFrame($.proxy(this.draw, this));
		},
		draw: function (time) {
			var offsetTop = this.cache.offsetTop,
				height = this.cache.height,
				scrollTop = Upfront_Parallax.cache.scrollTop,
				winHeight = Upfront_Parallax.cache.winHeight,
				scrollBottom = Upfront_Parallax.cache.scrollBottom,
				moveHeight = (this.movementOffset * 2) + (this.opts.movement * 2),
				range = 2 * this.movementOffset,
				movement = (this.movementOffset > 0 ? range / moveHeight : 1),
				translate = Math.round(movement * (scrollBottom - offsetTop - height)) - this.movementOffset,
				maxTranslate = Math.round(movement * (winHeight)) - this.movementOffset,
				minTranslate = maxTranslate*-1,
				effects = this.opts.effect.split(','),
				transform = ''
			;
			if (translate > maxTranslate) {
				translate = maxTranslate;
			}
			else if (translate < minTranslate) {
				translate = minTranslate;
			}
			
			if (this.cache.translate == translate) return;
			this.cache.translate = translate;
			
			for (i in effects) {
				var effect = this.getEffect(effects[i], translate, maxTranslate);
				if (effect.property == 'transform') {
					transform += (transform == '' ? '' : ' ');
					transform += effect.value;
				}
				else {
					this.$element.css(effect.property, effect.value);
				}
			}
			if (transform !== '') {
				this.$element.css('transform', transform);
			}
		},
		getEffect: function (effect, translate, maxTranslate) {
			var property = 'transform',
				value = '',
				position = translate/maxTranslate
			;
			switch (effect) {
				case 'scroll':
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