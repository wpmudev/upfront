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
		
		this.start();
	}
	
	// Static ID
	Upfront_Parallax.id = 0;
	
	Upfront_Parallax.prototype = {
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
			$(window).on('scroll.upfront_parallax_' + this.id, $.proxy(this.update, this));
		},
		unbindEvents: function () {
			$(window).off('scroll.upfront_parallax_' + this.id);
		},
		setOption: function (option, value) {
			this.opts[option] = value;
			this.refresh();
		},
		start: function () {
			this.$parent.addClass('upfront-parallax');
			this.refresh();
			this.bindEvents();
		},
		stop: function () {
			this.$parent.removeClass('upfront-parallax');
			this.reset();
			this.unbindEvents();
		},
		reset: function () {
			this.$element.css({
				transform: '',
				opacity: ''
			});
		},
		destroy: function () {
			this.stop();
			this.$parent.removeData('uparallax');
		},
		refresh: function () {
			var height = this.$parent.height(),
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
				bottom: this.movementOffset*-1
			});
			this.update();
		},
		update: function () {
			requestAnimationFrame($.proxy(this.draw, this));
		},
		draw: function (time) {
			var offset = this.$parent.offset(),
				height = this.$parent.height(),
				centerOff = Math.round(offset.top + (height / 2)),
				bottomOff = Math.round(offset.top + height),
				scrollTop = $(document).scrollTop(),
				winHeight = $(window).height(),
				scrollCenter = Math.round(scrollTop + (winHeight / 2)),
				scrollBottom = Math.round(scrollTop + winHeight),
				moveHeight = (this.movementOffset * 2) + (this.opts.movement * 2),
				range = 2 * this.movementOffset,
				movement = (this.movementOffset > 0 ? range / moveHeight : 1),
				translate = Math.round(movement * (scrollBottom - offset.top - height)) - this.movementOffset,
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