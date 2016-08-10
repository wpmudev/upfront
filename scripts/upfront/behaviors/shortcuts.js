(function ($) {

	var Shortcuts = {
		init: function(){
			$( document ).on("keyup", $.proxy(this._dispatch, this) );
		},
		keys: {
			a: 65,
			b: 66,
			c: 67,
			d: 68,
			e: 69,
			f: 70,
			g: 71,
			h: 72,
			i: 73,
			j: 74,
			k: 75,
			l: 76,
			m: 77,
			n: 78,
			o: 79,
			p: 80,
			q: 81,
			r: 82,
			s: 83,
			t: 84,
			u: 85,
			v: 86,
			w: 87,
			x: 88,
			y: 89,
			z: 90,
			0: 96,
			NUM_ONE: 97,
			NUM_TWO: 98,
			NUM_THREE: 99,
			NUM_FOUR: 100,
			NUM_FIVE: 101,
			NUM_SIX: 102,
			NUM_SEVEN: 103,
			NUM_EIGHT: 104,
			NUM_NINE: 105,
			NUM_MULTIPLY: 106,
			NUM_PLUS: 107,
			NUM_MINUS: 109,
			NUM_PERIOD: 110,
			NUM_DIVISION: 111
		},
		control_keys: {
			backspace: 8,
			"delete": 46,
			down: 40,
			enter: 13,
			space: 32,
			esc: 27,
			tab: 9,
			ctrl: 17,
			meta: 91,
			shift: 16,
			alt: 18,
			right: 39,
			left: 37,
			left_win: 91
		},
		shortcuts: {
			"alt+g": "toggle_grid"
		},
		_dispatch: function ( event ) {
			_(this.shortcuts).each( function( fn, shortcut ){
				shortcut = shortcut.replace(/^\s+|\s/g,'');
				fn = fn.replace(/^\s+|\s/g,'');
				var variations = shortcut.split(",");
				_(variations).each( function( variation ){
					var splitted = variation.split("+"),
							control_part = splitted.length > 1 ?  splitted[0].toLowerCase() + "Key" : false,
							k = splitted[1];
					if( control_part && event[control_part] && this.keys[k] === event.keyCode  ){
						this._call_method( event, fn );
					}else if( false === control_part &&  this.control_keys[k] === event.keyCode ){
						this._call_method( event, fn );
					}
				}, this);
			}, this);
		},
		_call_method: function(event, fn){
			if( typeof this[fn] === "function" )
				this[fn](event);
			else
				console.log( 'Undefined function "{fn}"'.replace("{fn}", fn));
		},
		show_grid: function () {
			this.$el.addClass('upfront-icon-grid-active');
			$('.upfront-overlay-grid').addClass('upfront-overlay-grid-show');
			Upfront.Application.set_gridstate(true);
		},
		hide_grid: function () {
			this.$el.removeClass('upfront-icon-grid-active');
			$('.upfront-overlay-grid').removeClass('upfront-overlay-grid-show');
			Upfront.Application.set_gridstate(false);
		},
		toggle_grid: function(e){
			Upfront.Events.trigger("grid:toggle");
		}

	};

	define(Shortcuts);

})(jQuery);
//# sourceURL=shortcuts.js