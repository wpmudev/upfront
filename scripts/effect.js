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
	Upfront_Parallax.start = function () {
		if (Upfront_Parallax.started) return;
		Upfront_Parallax.started = true;
		Upfront_Parallax.draw();
	}
	Upfront_Parallax.draw = function (time) {
		var scrollTop = Upfront_Parallax.cache.scrollTop;
		if (Upfront_Parallax.cache.lastScrollTop == scrollTop) {
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
		var scrollTop = $(window).scrollTop();
		Upfront_Parallax.cache.scrollTop = scrollTop;
	}
	$(window).on('scroll.upfront_paralax', Upfront_Parallax.updateScroll);
	
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
			this.$element.addClass('upfront-parallax');
			this.$moveElement.addClass('upfront-parallax-element');
			this.reset_cache();
			this.prepareFixedPos();
			this.refresh();
			this.bindEvents();
			Upfront_Parallax.start();
		},
		stop: function () {
			this.$element.removeClass('upfront-parallax');
			this.$moveElement.removeClass('upfront-parallax-element');
			this.restorePos();
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
				visible: true
			};
		},
		reset: function () {
			this.$moveElement.css({
				transform: '',
				opacity: ''
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
			this.$element.css({
				left: this.cache.offsetLeft,
				height: this.cache.height,
				width: this.cache.width
			});
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
			var offsetTop = this.cache.offsetTop,
				offsetBottom = this.cache.offsetBottom,
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
			if (offsetBottom > scrollTop && offsetTop < scrollBottom) {
				if (!this.cache.visible) {
					this.$element.css('visibility', 'visible');
				}
				this.$element.css({
					//transform: 'translate3d(0, ' + (offsetTop-scrollTop) + 'px, 0)'
					transform: 'translateY(' + (offsetTop-scrollTop) + 'px)'
				});
				this.cache.visible = true;
			}
			else {
				if (this.cache.visible) {
					this.$element.css({
						visibility: 'hidden',
						//transform: 'translate3d(0, ' + winHeight + 'px, 0)'
						//transform: 'translateY(' + winHeight + 'px)'
					});
					this.cache.visible = false;
				}
			}
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
					this.$moveElement.css(effect.property, effect.value);
				}
			}
			if (transform !== '') {
				this.$moveElement.css('transform', transform);
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