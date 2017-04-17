(function ($) {

window.empty = function (what) { return "undefined" === typeof what ? true : !what; };
window.count = function (what) { return "undefined" === typeof what ? 0 : (what && what.length ? what.length : 0); };
_.mixin({
	isTrue: function( val ) {
		if( typeof val === "undefined")
			return false;

		if( _.isString( val ) )
			return val.toLowerCase() === "true";

		if(_.isNumber( val ) )
			return 0 !== val;
	}
});

//requestFrameAnimation polyfill
var rAFPollyfill = function(callback){
		var currTime = new Date().getTime(),
			timeToCall = Math.max(0, 16 - (currTime - lastTime)),
			id = setTimeout(function() { callback(currTime + timeToCall); }, timeToCall)
		;
		lastTime = currTime + timeToCall;
		return id;
};



define([
	"pako",
	'scripts/upfront/upfront-cache'
], function ( pako, Cache ){

	var guessLinkType = function(url) {
		if(!$.trim(url) || $.trim(url) == '#' || $.trim(url) === '') {
			return 'unlink';
		}

		if(url.length && url[0] == '#') {
			return url.indexOf('#ltb-') > -1 ? 'lightbox' : 'anchor';
		}

		if(typeof window.location.origin !== "undefined") {
			if(url.substring(0, window.location.origin.length) == window.location.origin) {
				if(
					typeof window.location.pathname !== "undefined"
					&&
					url.substring(window.location.origin.length, window.location.origin.length+window.location.pathname.length) == window.location.pathname
					&&
					url.substring(window.location.origin.length+window.location.pathname.length)[0] == '#'
				) {
					return 'anchor';
				}
				return 'entry';
			}
		}

		if (url.match(/^mailto/)) {
			return 'email';
		}

		if (url.match(/^tel/)) {
			return 'phone';
		}

		return 'external';
	};

	var Util = {
		isRTL: function(){
			return !!Upfront.mainData.isRTL;
		},
		model_to_json: function (model) {
			if (!model) return {};
			var raw = (model && model.toJSON ? model.toJSON() : model),
				data_str = JSON.stringify(raw),
				json = JSON.parse(data_str)
			;

			return json;
		},

		get_unique_id: function (pfx) {
			return _.template("{{prefix}}-{{stamp}}-{{numeric}}", {
				prefix: pfx || "entity",
				stamp: (new Date()).getTime(),
				numeric: Math.floor((Math.random()*999)+1000)
			});
		},

		log: function () {
			var args = ["[UPFRONT]: "].concat(arguments);
			console.log.apply(console, args);
		},

		dbg: function () {
			Upfront.Util.log(JSON.stringify(arguments[0]));
		},

		/**
		 * Perform deep copy of an object
		 */
		clone: function (obj) {
			return jQuery.extend(true, {}, obj);
		},

		/**
		 * Escape RegEx string
		 * https://github.com/sindresorhus/escape-string-regexp/blob/master/index.js
		 */
		preg_quote: function (str) {
			var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

			if (typeof str !== 'string') {
				throw new TypeError('Expected a string');
			}

			return str.replace(matchOperatorsRe, '\\$&');
		},

		/**
		 * Check CSS support
		 */
		css_support: function ( property ) {
			var div = document.createElement('div'),
				reg = new RegExp("(khtml|moz|ms|webkit|)"+property, "i")
			;
			for ( var s in div.style ) {
				if ( s.match(reg) ) return true;
			}
			return false;
		},

		post: function (data, data_type) {
			var request = (_.isObject(data) && data.action) ? data : {"action": "upfront_request", "data": data};

			// @TODO need a better way to attach upfront layout data on request?
			if ( Upfront.Application.current_subapplication.layout ) {
				//request.upfront_layout = Upfront.Application.layout.get('layout');
				request.layout = Upfront.Application.current_subapplication.layout.get('layout');
			}
			if ( Upfront.layout_data_from_create_layout && request.data && request.data.post_id === 'fake_post' && !request.layout ) {
				request.layout = Upfront.layout_data_from_create_layout;
				Upfront.layout_data_from_create_layout = false;
			}
			if ( !request.storage_key ) request.storage_key = _upfront_storage_key;
			request.stylesheet = _upfront_stylesheet;

			// Some stuff depends if in builder or editor mode so lets make that
			// available for convenient server side check.
			request.mode = Upfront.Application.get_current();

			// Was request made from dev mode
			request.dev = location.search.indexOf('dev=true') > -1;

			// Was request made from the builder
			request.isbuilder = Upfront.Application.is_builder();

			//return $.post(Upfront.Settings.ajax_url, request, function () {}, data_type ? data_type : "json");
			return Cache.Request.get_response(request, data_type);
		},
		is_able_to_debug: function(){
			if( Upfront.Settings.Application.PERMS.DEBUG ) return true;

			Upfront.Util.log( "This user doesn't have enough permissions to debug or reset" );
			return false;
		},
		reset_layout: function () {
			if( !this.is_able_to_debug() ) return false;
			var request = {
				action: "upfront_reset_layout"
			};
			return this.post(request);
		},

		reset_cache: function () {
			if( !this.is_able_to_debug() ) return false;
			var request = {
				action: "upfront_reset_cache"
			};
			return this.post(request);
		},

		reset_all: function () {
			if( !this.is_able_to_debug() ) return false;

			var request = {
				action: "upfront_reset_all_from_db"
			};
			return this.post(request);
		},

		format_date: function(date, show_time, show_seconds){
				if (!date || !date.getFullYear) {
					if (date && date.length) {
						// Attempt to convert to proper object
						var old_date = date;
						date = new Date(Date.parse(date));
						if (!date) return old_date;
					}
					// If we're still here, and still have no date... bad luck
					if (!date|| !date.getFullYear) return date;
				}
				var output = date.getFullYear() + '/',
					day = date.getDate(),
					month = (date.getMonth()+1)
				;
				if(day < 10) day = '0' + day;
				if(month < 10) month = '0' + month;

				output += month + '/' + day;

				if(show_time){
					var hours = date.getHours(),
						minutes = date.getMinutes()
					;
					output += ' ' +
						(hours < 10 ? '0' : '') +
						hours + ':' +
						(minutes < 10 ? '0' : '') +
						minutes
					;
					if(show_seconds){
						var seconds = date.getSeconds();
							output += ':' +
								(seconds < 10 ? '0' : '') +
								seconds
						;
					}
				}
				return output;
		},
		get_avatar: function(obj, size){
			var protocolParts = window.location.href.split('//'),
				url = protocolParts[0] + '//www.gravatar.com/avatar/',
				hash = ''
			;

			size = size && parseInt(size, 10) == size ? size : 32;

			if(_.isString(obj)) hash = obj;
			else if(obj instanceof Upfront.Models.User || obj instanceof Upfront.Models.Comment) hash = obj.get('gravatar');
			else return false;

			return url + hash + '?d=mm&s=' + size;
		},
        grid : {
            /**
             * Sets proper class to passed in jquery object of the element
             *
             * @param jQuery object $el
             * @param string class_prefix|class_name either a class prefix like 'c' or a class name like c12
             * @param string|int|null class_size either a string of the class size like 12 or '12'
             */
            update_class :  function ($el, class_prefix, class_size) {
				var class_name;
                if (_.isUndefined(class_size)) {
					class_size = (class_prefix || '').replace( /[^\d.]/g, '');
                    class_name = class_prefix.replace(class_size, "");
                } else {
                    class_name = class_prefix;
                }
                var rx = new RegExp('\\b' + class_name + '\\d+');
                if ( ! $el.hasClass( class_name + class_size) ){
                    if ( $el.attr('class').match(rx) )
                        $el.attr('class', $el.attr('class').replace(rx, class_name + class_size));
                    else
                        $el.addClass( class_name + class_size );
                }
            },
            col_to_width: function (col_cls) {
            	if(!col_cls) return 0;

                 var column_width = Upfront.Settings.LayoutEditor.Grid.column_width,
                	col_class = Upfront.Settings.LayoutEditor.Grid['class']
				;
                return parseInt(col_cls.replace(col_class, ""), 10) * column_width;
            },
            width_to_col: function (width, ceil) {
                ceil = typeof  ceil === "undefined" ? false : ceil;
				width = parseInt( width, 10 );
				if( width < 0 ) return 0;
                var column_width = Upfront.Settings.LayoutEditor.Grid.column_width;
                return Math[ ceil ? "ceil" : "floor" ](width/column_width);
            },
            height_to_row: function (height) {
                var baseline = Upfront.Settings.LayoutEditor.Grid.baseline;
                return Math.ceil(height/baseline);
            },
            normalize_width: function(width){
                return this.width_to_col( width ) * Upfront.Settings.LayoutEditor.Grid.column_width;
            },
            normalize_height: function( height ){
                return this.height_to_row( height ) * Upfront.Settings.LayoutEditor.Grid.baseline;
            },
			derive_from_classes: function( classes, haystack ){
				if( !classes || classes.length < 2 || !haystack ) return false;
				var regex = new RegExp("(" + haystack +"\\d+(d)*)", "g"),
					res = classes.match(regex);
				return _.isEmpty(res) ? false : res[0] ;
			},
			derive_column_class: function( classes ){
				return this.derive_from_classes( classes, "c" );
			},
			derive_margintop_class: function( classes ){
				return this.derive_from_classes( classes, "mt" );
			},
			derive_marginleft_class: function( classes ){
				return this.derive_from_classes( classes, "ml" );
			}
        },
		width_to_col: function (width) {
			return this.grid.width_to_col(width);
		},

		height_to_row: function (height) {
			return this.grid.height_to_row(height);
		},

		openLightboxRegion: function(regionName){
			var regions = Upfront.Application.layout.get('regions'),
				region = regions.get_by_name(regionName)
			;

			if(!region) return;

			//hide other lightboxes
			_.each(regions.models, function(model) {
				if(model.attributes.sub == 'lightbox')
					Upfront.data.region_views[model.cid].hide();
			});

			Upfront.data.region_views[region.cid].show();
		},

		/**
		 * Sorted find
		 */
		find_sorted: function ($el, selector) {
			return $el.find(selector)
				.each(Upfront.Util.normalize_sort_elements_cb)
				.sort(Upfront.Util.sort_elements_cb)
			;
		},

		/**
		 * Callback to sort jQuery elements
		 */
		sort_elements_cb: function (a, b) {
			var cmp_a = $(a).data('breakpoint_order'),
				cmp_b = $(b).data('breakpoint_order');
			if ( ! _.isNumber(cmp_a) )
				cmp_a = $(a).data('dom_order');
			if ( ! _.isNumber(cmp_b) )
				cmp_b = $(b).data('dom_order');
			if ( cmp_a > cmp_b)
				return 1;
			else
				return -1;
			return 0;
		},

		/**
		 * Callback before sort jQuery element, to store DOM position, pass on $.each
		 */
		normalize_sort_elements_cb: function (index) {
			$(this).data('dom_order', index);
		},

		/**
		 * For sorted elements, we use this function to perform traversing search (replacement for next, prev, nextAll, prevAll, nextUntil, prevUntil)
		 */
		find_from_elements: function ($els, from, filter, reverse, until) {
			var index = $els.index($(from)),
				find_from = reverse ? _.first($els, index).reverse() : _.rest($els, index+1),
				finish = false,
				is_filter_cb = filter && _.isFunction(filter),
				is_until_cb = until && _.isFunction(until)
			;
			return $(_.filter(find_from, function(el){
				if ( finish ) return false;
				if ( ( is_filter_cb && filter($(el), $els) ) || ( !is_filter_cb && $(el).is(filter) ) ){
						if ( until && ( ( is_until_cb && until($(el), $els) ) || ( !is_until_cb && $(el).is(until) ) ) ){
								finish = true;
								return false;
						}
						return true;
				}
				return false;
			}));
		},

		// Crossbrowser requestAnimationFrame
		requestAnimationFrame:
			$.proxy(window.requestAnimationFrame, window) ||
			$.proxy(window.webkitRequestAnimationFrame, window) ||
			$.proxy(window.mozRequestAnimationFrame, window) ||
			$.proxy(window.oRequestAnimationFrame, window) ||
			$.proxy(window.msRequestAnimationFrame, window) ||
			rAFPollyfill,

		/* JS - PHP compatible templates */
		template: function(markup){
			var oldSettings = _.templateSettings,
				tpl = false;

			_.templateSettings = {
				interpolate : /<\?php echo (.+?) \?>/g,
				evaluate: /<\?php (.+?) \?>/g
			};

			tpl = _.template(markup);

			_.templateSettings = oldSettings;

			return function(data){
				_.each(data, function(value, key){
					data['$' + key] = value;
				});

				return tpl(data);
			};
		},

		Transient: {

			// Local storage object, or the in-memory queue
			_memory_queue: {},

			_key: window.location.path + window.location.search,

			initialize: function () {
				/*try {
					if ('sessionStorage' in window && window['sessionStorage'] !== null) this._memory_queue = sessionStorage;
				} catch (e) {
					Util.log("No local storage available, working off memory");
				}*/
				if (!Upfront.Settings.Debug.transients) this._memory_queue[this._key] = JSON.stringify({});
			},

			get_current: function () {
				return (this._memory_queue[this._key] ? JSON.parse(this._memory_queue[this._key]) : {});
			},

			length: function (key) {
				var data = this.get(key);
				return data.length;
			},

			set: function (key, value) {
				var current = this.get_current();
				current[key] = Util.model_to_json(value);
				this._memory_queue[this._key] = JSON.stringify(current);
			},

			get: function (key) {
				var current = this.get_current(),
					raw = current[key] || false
				;
				return raw;// ? JSON.parse(raw) : false;
			},

			get_all: function (prefix) {
				var key_rx = (prefix ? new RegExp(prefix) : false),
					data = [],
					history = (this._memory_queue[this._key] ? JSON.parse(this._memory_queue[this._key]) : false)
				;
				if (history) _(history).each(function (obj, key) {
					if (key_rx && !key.match(key_rx)) return true;
					data = obj;
				});
				return data;
			},

	// ----- Stack-like interface (for history) -----

			push: function (key, value) {
				var items = this.get(key) || [];
				items.push(value);
				return this.set(key, items);
			},

			pop: function (key) {
				var items = this.get(key) || [],
					item = items && items.pop ? items.pop() : false
				;
				this.set(key, items);
				return item;

			}
		},
		date : {
			php_format_to_jquery :  function(php_format)
			{
				var SYMBOLS_MATCHING = {
					// Day
					'd': 'dd',
					'D': 'D',
					'j': 'd',
					'l': 'DD',
					'N': '',
					'S': '',
					'w': '',
					'z': 'o',
					// Week
					'W': '',
					// Month
					'F': 'MM',
					'm': 'mm',
					'M': 'M',
					'n': 'm',
					't': '',
					// Year
					'L': '',
					'o': '',
					'Y': 'yy',
					'y': 'y',
					// Time
					'a': '',
					'A': '',
					'B': '',
					'g': '',
					'G': '',
					'h': '',
					'H': '',
					'i': '',
					's': '',
					'u': ''
				};
				jqueryui_format = "";
				escaping = false;
				for( var i = 0; i < php_format.length; i++)
				{
					var chr = php_format[i];
					if(chr === '\\') // PHP date format escaping character
					{
						i++;
						if(escaping) jqueryui_format += php_format[i];
						else jqueryui_format += '\'' + php_format[i];
						escaping = true;
					}
					else
					{
						if(escaping) { jqueryui_format += "'"; escaping = false; }
						if( _.isUndefined(SYMBOLS_MATCHING[chr])){
								jqueryui_format += chr;
						}else{
								jqueryui_format += SYMBOLS_MATCHING[chr];
						}

					}
				}
				return jqueryui_format;

			},
			php_format_to_js :  function(php_format)
			{
				var SYMBOLS_MATCHING = {
					// Day
					'd': 'dd',
					'D': 'D',
					'j': 'd',
					'l': 'DD',
					'N': '',
					'S': '',
					'w': '',
					'z': 'o',
					// Week
					'W': '',
					// Month
					'F': 'MMMM',
					'm': 'mmmm',
					'M': 'M',
					'n': 'm',
					't': '',
					// Year
					'L': '',
					'o': '',
					'Y': 'yyyy',
					'y': 'y',
					// Time
					'a': '',
					'A': '',
					'B': '',
					'g': '',
					'G': '',
					'h': '',
					'H': '',
					'i': '',
					's': '',
					'u': ''
				};
				jqueryui_format = "";
				escaping = false;
				for( var i = 0; i < php_format.length; i++)
				{
					var chr = php_format[i];
					if(chr === '\\') // PHP date format escaping character
					{
						i++;
						if(escaping) jqueryui_format += php_format[i];
						else jqueryui_format += '\'' + php_format[i];
						escaping = true;
					}
					else
					{
						if(escaping) { jqueryui_format += "'"; escaping = false; }
						if( _.isUndefined(SYMBOLS_MATCHING[chr])){
								jqueryui_format += chr;
						}else{
								jqueryui_format += SYMBOLS_MATCHING[chr];
						}

					}
				}
				return jqueryui_format;
			}
		},
		colors: {
			to_color_value: function (str) {
				if (Upfront.Util.colors.is_theme_color(str)) return Upfront.Util.colors.get_color(str);
				return str;
			},
			is_theme_color: function (str) {
				if (!str || !str.match) return false;
				return !!str.match(/^#?ufc\d+$/);
			},
			get_ufc: function(color){
				if(_.isEmpty(color)) return false;
				color = tinycolor(color);
				var	theme_colors = Upfront.Views.Theme_Colors.colors.pluck("color"),
					this_ufc;

				for(var _i in theme_colors){
					if( theme_colors[_i].replace("#", "") === color.toHex() ){
						this_ufc = "ufc" + _i;
					}
				}
				return this_ufc;
			},

			get_color: function(ufc){
				if(_.isEmpty(ufc)) return false;

                var theme_colors = Upfront.Views.Theme_Colors.colors.pluck("color"),
                    theme_alphas = Upfront.Views.Theme_Colors.colors.pluck("alpha"),
                    color_index = parseInt(ufc.replace("ufc", "").replace("#", ""), 10),
                    theme_color = theme_colors[color_index] === '#000000' && theme_alphas[color_index] === 0 ? 'inherit' : theme_colors[color_index];

                return theme_color;
			},
			/**
			 * Looks for ufc instances in a string and replaces them with actual color
			 *
			 * */
			convert_string_ufc_to_color: function( string, include_ufc_as_comment ){
				if(_.isEmpty(string)) return string;

				include_ufc_as_comment = typeof include_ufc_as_comment === "undefined" ? true : include_ufc_as_comment;
				var theme_colors = Upfront.Views.Theme_Colors.colors.pluck("color"),
					theme_alphas = Upfront.Views.Theme_Colors.colors.pluck("alpha");

				// lets clean up any existing commented out ufcs with their color specs
				var pattern_existing = new RegExp('/\\*[^,;\\n]*#ufc(\\d*)\\*/[^,;\\n]*([\\*/]*((#[A-Fa-f0-9]+)+|(rgb[a]?[^\\)]*\\))))+', 'g');
				string = string.replace(pattern_existing, "#ufc"+'$1');

				for(var _i in theme_colors){

					var theme_color = theme_colors[_i] === '#000000' && theme_alphas[_i] === 0 ? 'inherit' : theme_colors[_i];

					var pattern = new RegExp("#ufc" + _i,"g");

					theme_color = include_ufc_as_comment ? "/*" + "#ufc" + _i + "*/" + theme_color : theme_color;

					string = string.replace(pattern, theme_color );
				}
				return string;
			},
			/**
			 * Removes #ufc{x} from given string
			 * */
			remove_ufcs: function( string ){
				var	theme_colors = Upfront.Views.Theme_Colors.colors.pluck("color");
				for(var _i in theme_colors){
					var pattern = new RegExp( "/\\*#ufc" + _i + "\\*/" + theme_colors[_i],"g"),
						theme_color = theme_colors[_i];
					string = string.replace(pattern, theme_color );
				}
				return string;
			},
			/**
			 * Converts all theme color codes to ufc in the given string
			 * */
			convert_string_color_to_ufc: function( string ){
				var	theme_colors = Upfront.Views.Theme_Colors.colors.pluck("color");
				for(var _i in theme_colors){
					var pattern = new RegExp("/\\*#ufc" + _i + "\\*/" + theme_colors[_i],"gi"),
						ufc = "#ufc" + _i;
					string = string.replace(pattern, ufc );
				}
				return string;
			},
			/**
			 * Updates all the theme colors in the DOM according to the given color and color_index
			 *
			 * @var prev_color string color hex
			 * @var color string color hex
			 * @var color_index theme color index
			 * */
			update_colors_in_dom: function(prev_color, color, color_index){
				var regex = new RegExp("/\\*#ufc" + color_index + "\\*/#(?:[0-9a-fA-F]{3}){1,2}","gi"),
					container = document.getElementsByTagName("html")[0],
					replacement = "/*#ufc" + color_index +"*/" + color,
				finder = findAndReplaceDOMText(container , {
					find:  regex,
					replace: function(portion, match){
						return replacement;
					}
				} );
				$(".upfront-plain_txt > p").each(function(){
					var $this = $(this),
						html = $this.html();
					$this.html(  html.replace( regex,  replacement) );
				});

				var elements_with_ufc_data = $("*").filter(function(){
					return $(this).data("ufc");
				});

				$(elements_with_ufc_data).each(function(){
					var $this = $(this),
						ufc = $this.data("ufc"),
						ufc_rule = $this.data("ufc_rule");
						$this.css(ufc_rule, ufc);

				});
				return finder;
			},
			/**
			 * Updates wrong combinations of ufc and hex color so that the ufc and hex match
			 *
			 * It may be times where ufc is correct but the hex value is expired, this function updates the string
			 * so that these two match
			 *
			 * */
			update_colors_to_match_ufc: function(color_string){
				var	theme_colors = Upfront.Views.Theme_Colors.colors.pluck("color");
				for(var _i in theme_colors){
					var pattern = new RegExp("/\\*#ufc" + _i + "\\*/#(?:[0-9a-fA-F]{3}){1,2}","gi"),
						theme_color = "/*" + "#ufc" + _i + "*/" + theme_colors[_i];
					color_string = color_string.replace(pattern, theme_color );
				}
				return color_string;
			},
			/**
			 * Removes alpha from rgba and returns rgb,
			 * if given color is not rgba ( either hex or anything else) the exact color will be returned
			 * @param color
             * @returns {*}
             */
			rgba_to_rgb: function( color ){
				if( !_.isString( color ) ) return color;

				return color.replace(/ /g,'').replace(/^rgba\((\d+)\,(\d+)\,(\d+)\,(\d+\.?\d{0,}?)\)$/, "rgb($1, $2, $3)");
			}
		},
		guessLinkType: guessLinkType,
		visitLink: function(url) {
			var linktype = guessLinkType(url),
				regions,
				lightbox,
				regionview,
				selector;

			if (linktype === 'lightbox') {
				regions = Upfront.Application.layout.get('regions');
				lightbox = regions ? regions.get_by_name(url.substring(1)) : false;
				if (lightbox) {
					// Hide other lightboxes
					_.each(regions.models, function(model) {
						if(model.attributes.sub == 'lightbox')
						Upfront.data.region_views[model.cid].hide();
					});

					regionview = Upfront.data.region_views[lightbox.cid];
					regionview.show();
				}
			} else if (linktype == 'anchor') {
				selector = url.replace(/^.*?#/, '#');
				// In Editor, region anchors do not have prepended 'upfront-'.
				var alternateSelector = selector.replace('upfront-', '');
				if ($(selector).length > 0) {
					$('html,body').animate({scrollTop: $(selector).offset().top},'slow');
				} else if ($(alternateSelector).length > 0) {
					$('html,body').animate({scrollTop: $(alternateSelector).offset().top},'slow');
				} else {
					console.log('obsolete anchor');
				}
			}
			else if (linktype == 'entry') {
				window.location.href = url.replace('&editmode=true', '').replace('editmode=true', '')+((url.indexOf('?')>0)?'&editmode=true':'?editmode=true');
			} else {
				window.open(url);
			}
		},
		checkLightbox: function(url) {
			regions = Upfront.Application.layout.get('regions');
				lightbox = regions ? regions.get_by_name(url.substring(1)) : false;
				if (lightbox) {
					return true;
				}
				else
					return false;
		},

		/**
		 * Compress passed data using pako.deflate
		 *
		 * @param data
		 * @param options
		 * @returns {string} base64 encoded string
		 */
		compress: function (data, options) {
			// console.time('compressing');
			var default_options = { to: 'string', level: Upfront.mainData.save_compression_level },
				stringified, raw, encoded
			;
			if ( _.isObject(options) ) {
				options = _.extend(default_options, options);
			}
			else {
				options = default_options;
			}
			// Stringify data to preserve types
			stringified = JSON.stringify(data);
			// Use deflateRaw, so wrapper isn't included
			raw = pako.deflateRaw(stringified, options);
			// Base64 encode it so we can work with string
			encoded = btoa(raw);
			// console.log('compressed length:' + encoded.length, 'compressed ratio:' + Math.round(encoded.length/stringified.length*100)/100);
			// console.timeEnd('compressing');
			return {
				result: encoded,
				original_length: stringified.length,
				compressed_length: encoded.length
			};
		},

		/**
		 * Extract compressed data from pako.deflate, accept base64 encoded string
		 *
		 * @param compressed
		 * @param options
		 * @param compressed_length
		 * @param original_length
		 * @returns extracted data, with the same type before compression
		 */
		extract: function (compressed, options, compressed_length, original_length) {
			// console.time('extracting');
			if ( compressed_length && compressed_length !== compressed.length ) return false;
			var default_options = { to: 'string' },
				decoded, inflated, parsed
			;
			if ( _.isObject(options) ) {
				options = _.extend(default_options, options);
			}
			else {
				options = default_options;
			}
			// Base64 decode first
			decoded = atob(compressed);
			// Use inflateRaw to extract as we deflate without wrapper
			inflated = pako.inflateRaw(decoded, options);

			if ( original_length && original_length !== inflated.length ) return false;

			// Finally, parse it to get back original value
			parsed = JSON.parse(inflated);
			// console.timeEnd('extracting');
			return parsed;
		},

		/**
		 * Add string to clipboard, this must be called from user initiated action
		 * 
		 * @param text
		 */
		add_to_clipboard: function (text) {
			var textarea = document.createElement("textarea");
			
			textarea.value = text;
			document.body.appendChild(textarea);
			textarea.select();
			
			try {
			  	document.execCommand('copy');
			} catch (err) {
			    console.log('Copy failed', err);
			}
			
			document.body.removeChild(textarea);
		}
	};

	var Popup = {

		$popup: {},
		$background: {},
		_deferred: {},

		init: function () {
			if (!$("#upfront-popup").length) {
				$("#page")
					.append('<div id="upfront-popup" class="upfront-ui" style="display:none">' +
						'<div id="upfront-popup-close" class="upfront-icon upfront-icon-popup-close">&times;</div>' +
						'<div class="upfront-popup-meta" id="upfront-popup-top">' +
						'</div>' +
						'<div id="upfront-popup-content"></div>' +
						'<div class="upfront-popup-meta" id="upfront-popup-bottom">' +
						'</div>' +
					'</div>')
					.append("<div id='upfront-popup-background' style='display:none' />")
				;
			} else {
				this.close();
			}
			this.$popup = $("#upfront-popup");
			this.$background = $("#upfront-popup-background");

			this.$popup.find("#upfront-popup-content").empty();
		},

		open: function (callback, data, classname) {
				data = data || {};
				this.data = data;
				this.disable_esc = data.disable_esc || false;
				classname = classname || 'default-popup';
				this.init();
				var me = this,
						sidebarWidth = $('#sidebar-ui').width(),
						$win = $(window),
						width = data.width || 630,
						left_pos = ($win.width() - width) / 2 + sidebarWidth / 2,
						height = ($win.height() / 3) * 2,
						close_func = function () {
							$("#upfront-popup").attr('class', 'upfront-ui');
							me.close();
							return false;
						}
				;

				if ( !this.disable_esc ) {
					$('body').bind( 'keyup', function( event ) {
						if ( event.keyCode === 27 ) me.close();
					});
				}

				// data.width = width, data.height = height;
				this.$background
					// .css({
					// 	'height': $win.height(),
					// 	'width': $win.width() - sidebarWidth,
					// 	'left': sidebarWidth
					// })
					.on("click", close_func)
					.show()
				;
				this.$popup
					// .css({
					// 	'width': width,
					// 	'height': height,
					// 	'left': sidebarWidth
					// })
					.show()
					.find("#upfront-popup-close").on("click", close_func).end()
				;
				if ( classname ) {
					this.$popup
						.addClass(classname)
						.data("classname", classname)
					;
				}

				$('body').addClass('upfront-popup-open');
				/*
				$win.off("resize.upfront-popup").on("resize.upfront-popup", function () {
						if (me.$background.is(":visible")) {
							me.$background
								.css({
									'height': $win.height(),
									'width': $win.width() - sidebarWidth,
									'left': sidebarWidth
								})
							;
						}
						if (me.$popup.is(":visible")) {
							var left_pos = ($win.width() - width) / 2 + sidebarWidth / 2,
								height = ($win.height() / 3) * 2
							;
							me.$popup
								.css({
									'width': width,
									'height': height,
									'left': left_pos
								})
							;
						}
				});
			*/

				callback.apply(this.$popup.find("#upfront-popup-content").get(), [data, this.$popup.find("#upfront-popup-top"), this.$popup.find("#upfront-popup-bottom")]);
				this._deferred = new $.Deferred();
				return this._deferred.promise();
		},

		close: function (result) {
			if(this.data.hold_editor)
				this._deferred.notify('dont_close');
			else
				this._deferred.notify('before_close');

			this.$background.hide();
			this.$popup.hide().find("#upfront-popup-content").empty();

			this.$popup.find("#upfront-popup-top").empty();
			this.$popup.find("#upfront-popup-bottom").empty();

			$('body').removeClass('upfront-popup-open');

			// Clean up the passed classname
			var classname = this.$popup.data("classname");
			if (classname) {
				this.$popup.removeClass(classname);
			}

			Upfront.Events.trigger('popup:closed');

			this._deferred.resolve(this.$popup, result);
		}

	};

	var PreviewUpdate = function () {
		var _layout_data = false,
			_last_layout_data = false,
			_layout_compressed = false,
			_layout = false,
			_saving_flag = false,
			_is_dirty = false,
			_preview_url = false,
			_revision_idx = false,
			_tab_id = false,
			run = function (layout, tab_id) {
				if (!!Upfront.Settings.Application.PERMS.REVISIONS) { // Only rebind stuff when revisions listening is enabled.
					if (Upfront.Application.mode.current === Upfront.Application.MODE.THEME) {
						// Exporter mode
						rebind_exporter_events();
					} else {
						// Normal mode
						_tab_id = tab_id;
						_layout = layout;
						rebind_events();
					}
				}
				// Bind beforeunload event listener
				window.onbeforeunload = warn;
				// Bind unload event listener
				window.unload = stay;
			},
			/**
			 * Exporter events don't send out the preview saves, just manipulate flag directly.
			 */
			rebind_exporter_events = function () {
				Upfront.Events.off("entity:region:deactivated", exporter_set_dirty);
				Upfront.Events.off("entity:settings:deactivate", exporter_set_dirty);
				Upfront.Events.off("entity:removed:after", exporter_set_dirty);
				Upfront.Events.off("entity:resize_start", exporter_set_dirty);
				Upfront.Events.off("entity:drag_stop", exporter_set_dirty);
				Upfront.Events.off("entity:module:after_render", exporter_set_dirty);
				Upfront.Events.off("upfront:element:edit:stop", exporter_set_dirty);

				Upfront.Events.on("entity:region:deactivated", exporter_set_dirty, this);
				Upfront.Events.on("entity:settings:deactivate", exporter_set_dirty, this);
				Upfront.Events.on("entity:removed:after", exporter_set_dirty, this);
				Upfront.Events.on("entity:resize_start", exporter_set_dirty, this);
				Upfront.Events.on("entity:drag_stop", exporter_set_dirty, this);
				Upfront.Events.on("entity:module:after_render", exporter_set_dirty, this);
				Upfront.Events.on("upfront:element:edit:stop", exporter_set_dirty, this);

				Upfront.Events.off("command:layout:export_theme", clear);
				Upfront.Events.on("command:layout:export_theme", clear);
			},
			exporter_set_dirty = function () {
				_is_dirty = true;
			},
			rebind_events = function(){
				var me = this;
				Upfront.PreviewUpdate.__deferred_save_callback = Upfront.PreviewUpdate.__deferred_save_callback || _.debounce(save, 200);

				//Upfront.Events.off("entity:region:deactivated", save);
				//Upfront.Events.off("entity:settings:saved", save);
				//Upfront.Events.off("entity:module:after_render", save);

				//Upfront.Events.on("entity:region:deactivated", save, this);
				//Upfront.Events.on("entity:settings:saved", save, this);
				//Upfront.Events.on("entity:module:after_render", save, this);

				Upfront.Events.off("entity:removed:after", Upfront.PreviewUpdate.__deferred_save_callback);
				Upfront.Events.off("entity:resize_start", Upfront.PreviewUpdate.__deferred_save_callback);
				Upfront.Events.off("entity:drag_stop", Upfront.PreviewUpdate.__deferred_save_callback);
				Upfront.Events.off("upfront:element:edit:stop", Upfront.PreviewUpdate.__deferred_save_callback);

				Upfront.Events.on("entity:removed:after", Upfront.PreviewUpdate.__deferred_save_callback, this);
				Upfront.Events.on("entity:resize_start", Upfront.PreviewUpdate.__deferred_save_callback, this);
				Upfront.Events.on("entity:drag_stop", Upfront.PreviewUpdate.__deferred_save_callback, this);
				Upfront.Events.on("upfront:element:edit:stop", Upfront.PreviewUpdate.__deferred_save_callback, this);

				Upfront.Events.off("model:property:add", Upfront.PreviewUpdate.__deferred_save_callback);
				Upfront.Events.off("model:property:set", Upfront.PreviewUpdate.__deferred_save_callback);

				Upfront.Events.on("model:property:add", Upfront.PreviewUpdate.__deferred_save_callback, this);
				Upfront.Events.on("model:property:set", Upfront.PreviewUpdate.__deferred_save_callback, this);

				Upfront.Events.off("entity:region:deactivated", Upfront.PreviewUpdate.__deferred_save_callback, this);
				Upfront.Events.on("entity:region:deactivated", Upfront.PreviewUpdate.__deferred_save_callback, this);

				//Upfront.Events.off("model:property:remove", save);
				//Upfront.Events.on("model:property:remove", save, this);

				Upfront.Events.off("command:layout:save_success", clear);
				Upfront.Events.on("command:layout:save_success", clear);
			},
			set_data = function () {
				_layout_data = Upfront.Util.model_to_json(_layout);
				if (_layout_data && _layout_data.regions) _layout_data.regions = _(_layout_data.regions).reject(function (reg) { return reg.name === "shadow"; });
				_layout_data.layout = _upfront_post_data.layout;
				_layout_data.preferred_layout = _layout.get("current_layout");
				_layout_data.tab_id = _tab_id;

				if ( Upfront.mainData.save_compression ) {
					_layout_compressed = Upfront.Util.compress(_layout_data);
					_layout_data = _layout_compressed.result;
				}
				else {
					//_layout_data = JSON.stringify(_layout_data, undefined, 2);
					_layout_data = JSON.stringify(_layout_data);
				}
			},
			save = function () {
				if (_saving_flag) return false;

				_saving_flag = true;
				_is_dirty = true;
				set_data();

				// Don't flood server with unnecessary requests
				if (_layout_data === _last_layout_data) {
					_saving_flag = false;
					return;
				}
				_last_layout_data = _layout_data;

				Upfront.Events.trigger("preview:build:start");
				Upfront.Util.post({
						action: "upfront_build_preview",
						"data": _layout_data,
						"current_url": window.location.href,
						"original_length": _layout_compressed ? _layout_compressed.original_length : 0,
						"compressed_length": _layout_compressed ? _layout_compressed.compressed_length : 0,
						"compression": Upfront.mainData.save_compression ? 1 : 0
					})
					.success(function (response) {
						var data = response.data || {};
						if ("html" in data && data.html) {
							_preview_url = data.html;
							_revision_idx = data.idx;
						} else {
							Upfront.Util.log("Invalid response");
						}
						_saving_flag = false;
						Upfront.Events.trigger("preview:build:stop");

						//Upfront.Util.log("we're good here");

						// Notify about concurrent edits
						if ("concurrent_users" in data && data.concurrent_users && _.size(data.concurrent_users)) {
							var users = _.values(data.concurrent_users).join(', ');
							Upfront.Views.Editor.notify(Upfront.Settings.l10n.global.views.already_edited_nag.replace(/%s/, users), 'error');
						}
						// If multiple tabs are open, warn on save.
						if (data.other_tab_open) {
							Upfront.Views.Editor.notify(Upfront.Settings.l10n.global.views.multiple_tabs_nag, 'error');
						}
					})
					.error(function () {
						Upfront.Util.log("error building layout preview");
					})
				;

				run(_layout, _tab_id);
			},
			clear = function () {
				_is_dirty = false; // Clear dirty flag, we just saved changes
			},
			warn = function (e) {
				e = e || window.event;
				var going = Upfront.Settings.l10n.global.views.unsaved_changes_nag;
				if (!_saving_flag && !_is_dirty) return; // No changes
				if (e) e.returnValue = going;
				return going;
			},
			stay = function () {
				// throw global events to close the loading screen
				Upfront.Events.trigger('stay:upfront:editor');
			},
			get_preview_url = function () {
				return _preview_url;
			},
			get_revision = function () {
				return _revision_idx;
			}
		;
		return {
			run: run,
			preview_url: get_preview_url,
			get_revision: get_revision,
			rebind_events: rebind_events
		};

	};

	return {
		Util: Util,
		Popup: Popup,
		PreviewUpdate: new PreviewUpdate()
	};
});
})(jQuery);
