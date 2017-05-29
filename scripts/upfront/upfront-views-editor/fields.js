(function($){
	var l10n = Upfront.Settings && Upfront.Settings.l10n
			? Upfront.Settings.l10n.global.views
			: Upfront.mainData.l10n.global.views
		;
	define([
		"scripts/upfront/upfront-views-editor/mixins",
		"scripts/upfront/upfront-views-editor/theme-colors",
		"text!upfront/templates/color_picker.html"
	], function (Mixins, Theme_Colors, color_picker_tpl) {
		var Field = Backbone.View.extend({
			className: 'upfront-field-wrap',
			initialize: function (opts) {
				this.options = opts;
				this.multiple = typeof this.options.multiple != 'undefined' ? this.options.multiple : (typeof this.multiple != 'undefined' ? this.multiple : false);
				this.label = typeof this.options.label != 'undefined' ? this.options.label : '';
				this.default_value = typeof this.options.default_value != 'undefined' ? this.options.default_value : (this.multiple ? [] : '');
				if ( this.options.property ) {
					this.property = this.model.get_property_by_name(this.options.property);
					if ( this.property === false ) {
						this.model.init_property(this.options.property, this.default_value);
						this.property = this.model.get_property_by_name(this.options.property);
					}
					this.property_name = this.options.property;
					if ( typeof this.options.use_breakpoint_property != 'undefined' )
						this.use_breakpoint_property = this.options.use_breakpoint_property;
				}
				else {
					this.property = false;
				}
				this.name = this.options.name ? this.options.name : this.cid;
				this.selected_state = this.selected_state ? this.selected_state : '';
				if ( this.options.init )
					this.options.init();

				if ( this.init )
					this.init();
				if ( this.options.change )
					this.on('changed', this.options.change, this);
				if ( this.options.show )
					this.on('changed rendered', this.dispatch_show, this);
				if ( this.options.focus )
					this.on('focus', this.options.focus, this);
				if ( this.options.blur )
					this.on('blur', this.options.blur, this);
				if ( this.options.rendered )
					this.on('rendered', this.options.rendered, this);
				if (this.options.on_click)
					this['on_click'] = this.options.on_click;
				this.once('rendered', function(){
					var me = this;
					this.get_field().on('focus', function(){
						me.trigger('focus');
					}).on('blur', function(){
						me.trigger('blur');
					});
				}, this);
			},
			dispatch_show: function () {
				var me = this;
				setTimeout(function() {
					me.options.show(me.get_value(), me.$el);
				}, 100);
			},
			get_name: function () {
				return this.property ? this.property.get('name') : this.name;
			},
			get_saved_value: function () {
				if ( this.property ){
					if ( this.use_breakpoint_property )
						return this.model.get_breakpoint_property_value(this.property_name, true);
					else
						return this.property.get('value');
				}
				else if ( this.model ){
					var value = this.model.get(this.name);
					return value ? value : this.default_value;
				}
				return this.default_value;
			},
			get_value: function () {
				var $field = this.get_field();
				if ( ! this.multiple || ($field.size() == 1 && $field.is('select')) )
					return $field.val();
				else
					return _.map($field, function (el) { return $(el).val(); });
				return false;
			},
			set_value: function (value) {
				this.get_field().val(value);
			},
			get_field_id: function () {
				return this.cid + '-' + this.get_name();
			},
			get_field_name: function () {
				return this.get_name();
			},
			get_field: function () {
				return this.$el.find( '[name=' + this.get_field_name() + ']' + (this.selected_state ? ':'+this.selected_state : '') );
			},
			get_label_html: function () {
				if (this.options.hide_label === true) return '';
				var attr = {
					'for': this.get_field_id(),
					'class': 'upfront-field-label ' + ( this.options.label_style == 'inline' ? 'upfront-field-label-inline' : 'upfront-field-label-block' )
				};
				return '<label ' + this.get_field_attr_html(attr) + '>' + this.label + '</label>';
			},
			get_field_attr_html: function (attr) {
				return _.map(attr, function(value, att){
					return att + '="' + value + '"';
				}).join(' ');
			}
		});

		var Field_Text = Field.extend({
			className: 'upfront-field-wrap upfront-field-wrap-text',
			render: function () {
				this.$el.html('');
				if ( !this.options.compact )
					this.$el.append(this.get_label_html());
				this.$el.append(this.get_field_html());
				var me = this;
				this.get_field().keyup(function(){
					if ( '' === $(this).val() ){
							$(this).addClass('upfront-field-empty');
					}
					else if ( $(this).hasClass('upfront-field-empty') ) {
							$(this).removeClass('upfront-field-empty');
					}
				}).trigger('keyup').change(function(){
					me.trigger('changed', me.get_value());
				});
				this.trigger('rendered');
			},
			get_field_html: function () {
				var attr = {
					'type': 'text',
					'class': 'upfront-field upfront-field-text',
					'id': this.get_field_id(),
					'name': this.get_field_name(),
					'value': this.get_saved_value()
				};
				if ( this.options.compact ) {
					attr.placeholder = this.label;
					this.$el.attr('title', this.label);
				}
				else if ( this.options.placeholder ) {
					attr.placeholder = this.options.placeholder;
				}
				return '<input ' + this.get_field_attr_html(attr) + ' />';
			}
		});

		var Field_Title = Field.extend({
			className: 'upfront-field-wrap upfront-field-wrap-title',
			render: function () {
				this.$el.html('');

				if ( this.label ) {
					this.$el.append('<div class="upfront-field-title"><span>' + this.label + '</span></div>');
				}
			},

			get_field_html: function () {
				return '';
			}
		});

		/**
		 * Start in initially not editable state.
		 * Used for things such as permalink fields in "New Page" dialog.
		 * Not exposed globally.
		 */
		var Field_ToggleableText = Field_Text.extend({
			is_edited: false,
			className: 'upfront-field-wrap upfront-field-wrap-text upfront-field-wrap-toggleable',
			render: function () {
				Field_Text.prototype.render.call(this);
				if (this.is_edited) return false;
				this.$el.append(
						' ' +
						'<a href="#" class="upfront-toggleable-button">Edit</a>'
				);
				var me = this;
				this.$el.on('click', '.upfront-toggleable-button', function (e) {
						e.preventDefault();
						e.stopPropagation();
						var $me = $(this),
								$el = me.get_field()
								;
						$me.hide();
						$el.replaceWith(me.get_editable_html());
						me.is_edited = true;
				});
			},
			has_been_edited: function () {
				return this.is_edited;
			},
			reset_state: function () {
				this.is_edited = Field_ToggleableText.prototype.is_edited;
			},
			get_field_html: function () {
				return this.is_edited
					? this.get_editable_html()
					: this.get_toggleable_html()
					;
			},
			get_field: function () {
				return this.is_edited
					? Field_Text.prototype.get_field.call(this)
					: this.$el.find(".upfront-field-toggleable-value")
					;
			},
			get_value: function () {
				return this.is_edited
					? Field_Text.prototype.get_value.call(this)
					: $.trim(this.get_field().text())
					;
			},
			set_value: function (value) {
				return this.is_edited
					? this.get_field().val(value)
					: this.get_field().text(value)
					;
			},
			get_toggleable_html: function () {
				var value = this.get_value() || this.get_saved_value();
				return '<span class="upfront-field-toggleable-value">' + value + '</span>';
			},
			get_editable_html: function () {
				var attr = {
					'type': 'text',
					'class': 'upfront-field upfront-field-text upfront-field-toggleable',
					'id': this.get_field_id(),
					'name': this.get_field_name(),
					'value': this.get_value() || this.get_saved_value()
				};
				if ('inline' === this.options.label_style) attr['class'] += ' upfront-has_inline_label';
				if ( this.options.compact ) {
					attr.placeholder = this.label;
					this.$el.attr('title', this.label);
				}
				else if ( this.options.placeholder ) {
					attr.placeholder = this.options.placeholder;
				}
				return '<input ' + this.get_field_attr_html(attr) + ' />';
			}
		});

		var Field_Button = Field.extend({
			className: 'upfront-field-wrap upfront-field-wrap-button',
			events: {
				'click' : 'on_click'
			},
			render: function () {
				this.$el.html('');
				if ( !this.options.compact )
					this.$el.append(this.get_label_html());
				if ( this.options.info) {
					this.$el.append(this.get_info_html());
				}
				this.$el.append(this.get_field_html());
				var me = this;

				if (this.options.classname) this.$el.addClass(this.options.classname);

				this.trigger('rendered');
				this.delegateEvents();
			},
			get_info_html: function() {
				return '<span class="button-info">' + this.options.info + '</span>';
			},
			get_field_html: function () {
				var attr = {
					'type': 'button',
					'class': 'upfront-field upfront-field-button',
					'id': this.get_field_id(),
					'name': this.get_field_name(),
					'value': this.label
				};
				if ( this.options.compact ) {
					attr.placeholder = this.label;
					this.$el.attr('title', this.label);
				}
				else if ( this.options.placeholder ) {
					attr.value = this.options.placeholder;
				}
				return '<input ' + this.get_field_attr_html(attr) + ' />';
			}
		});

		var Field_Email = Field_Text.extend({
			get_field_html: function () {
				var attr = {
					'type': 'email',
					'class': 'upfront-field upfront-field-text upfront-field-email',
					'id': this.get_field_id(),
					'name': this.get_field_name(),
					'value': this.get_saved_value()
				};
				if ( this.options.compact ) {
					attr.placeholder = this.label;
					this.$el.attr('title', this.label);
				}
				else if ( this.options.placeholder ) {
					attr.placeholder = this.options.placeholder;
				}
				return '<input ' + this.get_field_attr_html(attr) + ' />';
			}
		});

		var Field_Textarea = Field_Text.extend({
			className: 'upfront-field-wrap upfront-field-wrap-text upfront-field-wrap-textarea',
			get_field_html: function () {
				var attr = {
					'cols': '40',
					'rows': '5',
					'class': 'upfront-field upfront-field-text upfront-field-textarea',
					'id': this.get_field_id(),
					'name': this.get_field_name()
				};
				if ( this.options.compact ) {
					attr.placeholder = this.label;
					this.$el.attr('title', this.label);
				}
				else if ( this.options.placeholder ) {
					attr.placeholder = this.options.placeholder;
				}
				return '<textarea ' + this.get_field_attr_html(attr) + '>' + this.get_saved_value() + '</textarea>';
			}
		});

		var Field_Number = Field_Text.extend({
			className: 'upfront-field-wrap upfront-field-wrap-number',
			get_field_html: function () {
				var attr = {
					'type': 'number',
					'class': 'upfront-field upfront-field-number',
					'id': this.get_field_id(),
					'name': this.get_field_name(),
					'value': this.get_saved_value()
				};
				if ( typeof this.options.min != 'undefined' )
					attr.min = this.options.min;
				if ( typeof this.options.max != 'undefined' )
					attr.max = this.options.max;
				if ( typeof this.options.step != 'undefined' )
					attr.step = this.options.step;
				return ' <input ' + this.get_field_attr_html(attr) + ' /> ' + (this.options.suffix ? this.options.suffix : '');
			}
		});

		var Field_Slider = Field_Text.extend(_.extend({}, Mixins.Upfront_Icon_Mixin, {
			className: 'upfront-field-wrap upfront-field-wrap-slider',
			initialize: function(opts) {
				this.options = opts;
				Field_Slider.__super__.initialize.apply(this, arguments);

				var me = this,
					options = {
							range: this.getOption('range', 'min'),
							min: this.getOption('min', 0),
							max: this.getOption('max', 0),
							step: this.getOption('step', 1),
							orientation: this.getOption('orientation', 'horizontal'),
							value: this.get_saved_value()
					}
				;

				this.value = this.get_saved_value();
				if(typeof this.value == 'undefined')
					this.value = options.min;

				if(this.options.callbacks)
					_.extend(options, this.options.callbacks);

				options.slide = function(e, ui){
					var valueText = ui.value;
					me.value = valueText;

					me.$('input').val(me.value).trigger('change');

					if(me.options.valueTextFilter)
						valueText = me.options.valueTextFilter(valueText);

					me.$('.upfront-field-slider-value').text(valueText);

					if(me.options.callbacks && me.options.callbacks.slide)
						me.options.callbacks.slide(e, ui);
				};

				this.on('rendered', function(){
					var $field = me.$('#' + me.get_field_id());
					if ( options.orientation == 'vertical' ){
						$field.addClass('upfront-field-slider-vertical');
					}
					$field.slider(options);
				});
			},
			get_field_html: function () {
				var output = '<input type="hidden" name="' + this.get_field_name() + '" value="' + this.value + '">',
					value = this.value
				;

				if(this.options.info)
					output += '<div class="upfront-field-info">' + this.options.info + '</div>';

				output += '<div class="upfront-field upfront-field-slider" id="' + this.get_field_id() + '"></div>';

				if(this.options.valueTextFilter)
					value = this.options.valueTextFilter(value);

				output += '<div class="upfront-field-slider-value"> ' + value + '</div>';
				return output;
			},

			getOption: function(option, def){
				return this.options[option] ? this.options[option] : def;
			}
		}));

		var Field_Hidden = Field_Text.extend({
			className: 'upfront-field-wrap upfront-field-wrap-hidden',
			get_field_html: function(){
				var attr = {
					type: 'hidden',
					id: this.get_field_id(),
					name: this.get_field_name(),
					'class': 'upfront-field upfront-field-hidden',
					'value': this.get_saved_value()
				};
				return ' <input ' + this.get_field_attr_html(attr) + ' /> ';
			}
		});

		var Field_Color = Field_Text.extend({
			className: 'upfront-field-wrap upfront-field-wrap-color sp-cf',
			defaults : {
				blank_alpha : 1,
				autoHide: true,
				hideOnOuterClick: true
			},
			spectrumDefaults: {
				clickoutFiresChange: true,
				showSelectionPalette: true,
				showAlpha: true,
				showPalette: true,
				localStorageKey: "spectrum.recent_colors",
				palette: Theme_Colors.colors.pluck("color").length ? Theme_Colors.colors.pluck("color") : [],
				maxSelectionSize: 10,
				preferredFormat: "hex",
				showButtons: false,
				showInput: true,
				allowEmpty:true,
				appendTo : "parent"
			},
			events : {
				'change .upfront_color_picker_rgba input' : 'rgba_sidebar_changed',
				'change .sp-input' : 'sp_input_changed',
				'click .upfront_color_picker_reset' : 'set_to_blank'
			},
			initialize: function(opts){
				this.options = _.extend({}, this.defaults, opts);
				this.field_options = _.extend({}, this.defaults, opts);

				this.options.blank_alpha = _.isUndefined( this.options.blank_alpha ) ? 1 : this.options.blank_alpha;
				this.sidebar_template = _.template(color_picker_tpl);
				var me = this,
					spectrumOptions = typeof this.options.spectrum == 'object' ? _.extend({}, this.spectrumDefaults, this.options.spectrum) : this.spectrumDefaults
				;
				
				this.rgba = {
					r : 0,
					g : 0,
					b : 0,
					a : 0
				};

				this.spectrumOptions = spectrumOptions;

				spectrumOptions.move = _.bind( this.on_spectrum_move, this ) ;

				spectrumOptions.show = _.bind( this.on_spectrum_show, this );

				spectrumOptions.beforeShow = _.bind( this.on_spectrum_beforeShow, this );

				/**
				 * Wrap the hide callback so we can re-use it.
				 */
				var hide = function (color) {
					if (me.options.spectrum && me.options.spectrum.hide) {
						me.options.spectrum.hide(color);
					}
				};
				// Add wrapped hide callback
				spectrumOptions.hide = hide;
				if( !spectrumOptions.autoHide  ){
					spectrumOptions.hide = function(color){
						me.color = color;
						// And if we override the hide callback, re-apply it in overridden method
						hide(color);
						me.$(".sp-replacer").addClass("sp-active");
						me.$(".sp-container").removeClass("sp-hidden");
					};
				}

				this.l10n_update = _.debounce(function () {
					// Let's fix the strings
					$(".sp-container").each(function () {
						$(this)
							.find(".sp-input-container").attr("data-label", l10n.current_color).end()
							.find(".sp-palette-container").attr("data-label", l10n.theme_colors).end()
							.find(".sp-palette-row:last").attr("data-label", l10n.recent_colors)
						;
					});
				});

				Field_Color.__super__.initialize.apply(this, arguments);
				this.on('rendered', this._rendered );

			},
			_rendered: function(){
				var me = this;
				this.$('input[name=' + this.get_field_name() + ']').spectrum(this.spectrumOptions);
				this.$spectrum = this.$('input[name=' + this.get_field_name() + ']');

				// Listen to spectrum events and fire off l10n labels update
				this.$spectrum.on("reflow.spectrum move.spectrum change", this.l10n_update);

				this.$(".sp-container").append("<div class='color_picker_rgb_container'></div>");
				this.update_input_border_color(this.get_saved_value());
				this.$(".sp-container").data("field_color", this);
				this.$(".sp-container").data("$spectrum", this.$spectrum );
				this.$spectrum.on("change.spectrum", function(e) {
				if(me.options.spectrum && me.options.spectrum.choose && me.color)
					me.options.spectrum.choose(me.color);

					if( me.options.autoHide === true ){
						setTimeout( function() {
							me.$(".sp-replacer").removeClass("sp-active");
							me.$(".sp-container").addClass("sp-hidden");
						});
		
						Upfront.Events.trigger("color:spectrum:hide");
					}
				});

				/**
				 * Translate the ok button
				 */
				this.$(".sp-container").find(".sp-choose").text( Upfront.Settings.l10n.global.content.ok );

			},
			/**
			 * Listens to spectrum move event
			 *
			 * @param color
			 * @param e
			 */
			on_spectrum_move: function(color, e){
				if( !_.isEmpty( color ) ){
					this.color = color;
					var rgb = color.toRgbString();
					$('.sp-dragger').css({
						'border-top-color': rgb,
						'border-right-color': rgb
					});
					this.update_input_border_color( color.toRgbString() );
					this.update_input_val( rgb );
					this.rgba = _.extend(this.rgba, color.toRgb());
					this.render_sidebar_rgba(this.rgba);
				}

				if(this.options.spectrum && this.options.spectrum.move)
					this.options.spectrum.move(color);

				this.toggle_alpha_selector(color, e);
			},
			/**
			 * Listens to spectrum show event
			 *
			 * @param color
			 */
			on_spectrum_show: function(color){
	
				Upfront.Events.trigger("color:spectrum:show");

				var $input = $(".sp-input"),
					input_val = $input.val()
				;

				if( !_.isEmpty( color ) ) {
					this.color = color;
					var rgb = color.toRgbString();
					this.rgba = _.extend(this.rgba, color.toRgb());
					this.update_input_border_color( color.toRgbString() );
					this.render_sidebar_rgba(this.rgba);
					this.update_input_val( rgb );
				}
				if( !_.isEmpty( input_val) && !this.is_hex( input_val )){
					var t_color = tinycolor( input_val );
					$input.val(t_color.toRgbString());
				}
				//this.spectrumOptions = spectrumOptions;

				if(this.options.spectrum && this.options.spectrum.show)
					this.options.spectrum.show(color);

				/**
				 * Dont allow more than one top be open
				 */
				$(".sp-container").not( this.$(".sp-container")).each(function(){
					var $this = $(this),
						options = $this.data("sp-options");
					if( !options || !options.flat  ){
						$this.addClass("sp-hidden");
					}
				});

				if( !_.isEmpty( color ) ){
					var me = this,
					input_val_color = tinycolor( color );

					// We need a delay to load if color is theme color
					setTimeout( function() {
						me.toggle_alpha_selector( color );
					}, 100);
				}

				if( this.options.spectrum && !this.options.spectrum.flat && ( !this.field_options || !this.field_options.flat ) && this.field_options.hideOnOuterClick )
					$("html").on('mousedown', _.bind( this.hide_on_outer_click, this ) );
			},
			on_spectrum_beforeShow: function(color){
				if( color instanceof Object ){
					$.extend(color, tinycolor.prototype);
				}
				this.color = color;
				this.update_palette(); // Make sure we're up to date
				this.$('input[name=' + this.get_field_name() + ']').spectrum("option", "palette", this.options.palette);
				if(this.options.spectrum && this.options.spectrum.beforeShow) this.options.spectrum.beforeShow(color);

				this.$(".sp-container").data("sp-options", this.options.spectrum );
			},
			render: function () {
				Field_Color.__super__.render.apply(this, arguments);
				// Re-bind debounced listeners for theme color updates
				this.stopListening(Upfront.Events, "theme_colors:update");
				var cback = _.debounce(this.update_palette, 200);
				this.listenTo(Upfront.Events, "theme_colors:update", cback, this);
			},
			/**
			 * Hides picker on outer click
			 *
			 * @param e event
			 */
			hide_on_outer_click: function(e){
				if( this.$(".sp-container").hasClass("sp-hidden") ) return;

				var $target = $(e.target);
				if( $target.is(".sp-container") || $target.parents(".sp-container").length ) return;

				this.revert();
				this.$(".sp-container").addClass("sp-hidden"); //  hide
				Upfront.Events.trigger("color:spectrum:hide");
				$("html").off('mousedown', _.bind( this.hide_on_outer_click, this ) );
			},
			revert: function(){
				this.$spectrum.trigger("click.spectrum"); // trigger cancel
				if(this.options.spectrum && typeof this.options.spectrum.change === "function")
					this.options.spectrum.change(this.color);// Explicitly cancel

				if( this.color && this.color.toRgbString )
					this.update_input_border_color(this.color.toRgbString); // Set input color
			},
			update_palette: function () {
				if (this.$spectrum && this.$spectrum.spectrum) {
					this.$spectrum.spectrum("option", "palette", Theme_Colors.colors.pluck("color").length ? Theme_Colors.colors.pluck("color") : []);
				}
			},
			is_hex : function(color_code){
				return color_code.indexOf( "#" ) === -1 ? false : true;
			},
			get_field_html: function () {
				var attr = {
					'type': 'text',
					'class': 'upfront-field upfront-field-color',
					'id': this.get_field_id(),
					'name': this.get_field_name(),
					'value': this.get_saved_value()
				};
				return ' <input ' + this.get_field_attr_html(attr) + ' /> ' + (this.options.suffix ? this.options.suffix : '');
			},
			get_saved_value: function () {
				if ( this.property ){
					if ( this.use_breakpoint_property )
						return Upfront.Util.colors.to_color_value(this.model.get_breakpoint_property_value(this.property_name, true));
					else
						return Upfront.Util.colors.to_color_value(this.property.get('value'));
				}
				else if ( this.model ){
					var value = this.model.get(this.name);
					return value ? Upfront.Util.colors.to_color_value(value) : Upfront.Util.colors.to_color_value(this.default_value);
				}
				return Upfront.Util.colors.to_color_value(this.default_value);
			},
			update_input_border_color : function(rgb){
				var spPreview = this.$el.find(".sp-preview"),
					me = this
				;
	
				setTimeout( function() {
					me.$el.find(".upfront_color_picker_rgb_main").css({
						backgroundColor: rgb
					});
				}, 10);

				spPreview.css({
					backgroundColor: rgb
				});

				if( rgb !== 'rgba(0, 0, 0, 0)' ) {
					spPreview.removeClass('uf-unset-color');
				}
				else if( spPreview.closest( '.theme_colors_empty_picker' ).length === 0 ) {
					spPreview.addClass('uf-unset-color');
				}
			},
			update_input_val : function(hex){
				this.$(".sp-input").val(hex);
			},
			render_sidebar_rgba : function(rgba){
				var self = this;
				this.$(".color_picker_rgb_container").html(this.sidebar_template(rgba));
				this.$(".upfront_color_picker_reset").on("click", function(e){
					e.preventDefault();
					self.set_to_blank();
				});
			},
			rgba_sidebar_changed : function(e){
				var $el = $(e.target),
					type = $el.data("type"),
					val = parseFloat($el.val()),
					color = this.$spectrum.spectrum("get"),
					selection = {}
				;
				selection[type] = val;
				color = tinycolor(_.extend(color.toRgb(), selection));
				// Set the new color
				this.$spectrum.spectrum("set", color.toRgbString());
				this.update_input_border_color( color.toRgbString() );
				this.update_input_val( color.toRgbString() );
				this.render_sidebar_rgba(  color.toRgb() );
				// Trigger move event
				if(this.options.spectrum && typeof this.options.spectrum.move === "function"){
					this.options.spectrum.move(color);
				}
				// Trigger change event
				if(this.options.spectrum && typeof this.options.spectrum.change === "function"){
					this.options.spectrum.change(color);
				}
				e.stopPropagation();
				e.preventDefault();
				this.$spectrum.trigger("dragstop.spectrum");
			},
			sp_input_changed : function(e){
				var color = tinycolor($(e.target).val());
				// Trigger move event
				if(this.options.spectrum && typeof this.options.spectrum.move === "function"){
					this.options.spectrum.move(color);
				}
				// Trigger change event
				if(this.options.spectrum && typeof this.options.spectrum.change === "function"){
					this.options.spectrum.change(color);
				}
				//Update preview color
				this.update_input_border_color(color.toRgbString);
			},
			set_to_blank : function(){
				var blank_color = 'rgba(0, 0, 0, ' + ( _.isUndefined( this.options.blank_alpha ) ? 1 : this.options.blank_alpha ) + ')',
					color = tinycolor(blank_color)
				;
				
				color.reset = true;
				this.rgba = {r: 0, g: 0, b:0, a: 0};
				this.$spectrum.spectrum("set", color.toRgbString() );
				this.update_input_border_color( blank_color );
				this.update_input_val( "#000000" );
				this.render_sidebar_rgba(  this.rgba );

				// Trigger move event
				if(this.options.spectrum && typeof this.options.spectrum.move === "function"){
					this.options.spectrum.move(color);
				}

				// Trigger change event
				if(this.options.spectrum && typeof this.options.spectrum.change === "function"){
					this.options.spectrum.change(color);
				}

				// Trigger move event in Theme Color Swatches
				if(this.options && typeof this.options.move === "function"){
					this.options.move(color);
				}

				// Trigger change event in Theme Color Swatches
				if(this.options && typeof this.options.change === "function"){
					this.options.change(color);
				}
			},
			get_value : function() {
				return this.$el.find(".sp-preview-inner").css('background-color');
			},
			set_value : function(rgba) {
				if (Upfront.Util.colors.is_theme_color(rgba)) rgba = Upfront.Util.colors.get_color(rgba);
				var color = tinycolor(rgba);
				this.color = color;
				this.$spectrum.spectrum("set", color );
			},
			toggle_alpha_selector: function(color){
				if( _.isEmpty( color ) ) return;

				var $alpha = this.$(".sp-alpha");
				
				if( typeof this.options.hide_alpha !== "undefined" && this.options.hide_alpha ){
					$alpha.addClass("sp-alpha-disabled sp-alpha-lower-opacity");
					$overlay = $("<span class='sp-alpha-overlay' title='"+ l10n.theme_colors_opacity_disabled +"'>"+ l10n.theme_colors_opacity_disabled +"</span>")
						.on("click", function(e){
							e.stopPropagation();
							e.preventDefault();
						});
					if( !this.$(".sp-alpha-overlay").length ){
						$alpha.before($overlay);
					}
				} else {
					$alpha.removeClass("sp-alpha-disabled sp-alpha-lower-opacity");
					this.$(".sp-alpha-overlay").remove();
				}
			}
		});


		var Field_Multiple = Field.extend(_.extend({}, Mixins.Upfront_Icon_Mixin, {
			get_values_html: function () {
				return _.map(this.options.values, this.get_value_html, this).join('');
			},
			set_value: function (value) {
				this.$el.find('[value="'+value+'"]').trigger('click');
			}
		}));

		var Field_Select = Field_Multiple.extend(_.extend({}, Mixins.Upfront_Scroll_Mixin, {
				events: {
					// closing dropdown is in global-event-handlers.js
					'click .upfront-field-select': 'openOptions',
					'mouseup .upfront-field-select': 'onMouseUp',
					'change .upfront-field-select-option input': 'onChange',
					'click .upfront-field-select-option label': 'onOptionClick'
				},

				onOptionClick: function(e) {
					if ( !this.multiple ) {
						e.stopPropagation();
						if ( $(this).closest('.upfront-field-select-option').hasClass('upfront-field-select-option-disabled') ) {
							return;
						}

						// Make sure that input is clicked (for some reason in redactor toolbar this does not work naturally)
						if ( $(e.currentTarget).siblings('input').not(':checked')) {
							$(e.currentTarget).siblings('input').click();
						}

						this.$el.find('.upfront-field-select').removeClass('upfront-field-select-expanded');
						this.trigger('blur');
					}
				},

				openOptions: function(e) {
					if(e)
							e.stopPropagation();
					if ( this.options.disabled )
							return;
					$('.upfront-field-select-expanded').removeClass('upfront-field-select-expanded');
					this.$el.find('.upfront-field-select').css('min-width', '').css('min-width', this.$el.find('.upfront-field-select').width());
					this.$el.find('.upfront-field-select').addClass('upfront-field-select-expanded');
					this.$el.addClass('upfront-field-wrap-select-expanded');

					// Make sure all select options are visible in scroll panel i.e. scroll scroll panel as needed
					var me = this;
					_.delay(function() { // Delay because opening animation causes wrong outerHeight results
						var in_sidebar = me.$el.parents('#sidebar-ui').length,
							in_settings = me.$el.parents('#element-settings-sidebar').length,
							in_region = me.$el.parents('#region-settings-sidebar').length,
							settingsTitleHeight = 46;

						// Apply if select field is in sidebar or settings sidebar
						if(in_sidebar == 1 || in_settings == 1 || in_region == 1) {
							var select_dropdown = me.$el.find('.upfront-field-select-options'),
								select = select_dropdown.parent(),
								dropDownTop = select.offset().top - $('#element-settings-sidebar').offset().top;
								dropDownTop = dropDownTop + settingsTitleHeight
							;

							select_dropdown.css("width", select.width() + 3);
							select_dropdown.css('top', dropDownTop + "px");
							if( Upfront.Util.isRTL() )
								select_dropdown.css('right',  ( $(window).width() - select.offset().left - select.width() ) + "px");
							else
								select_dropdown.css('left',  select.offset().left + "px");
							select_dropdown.css('display', 'block');
						}
					}, 10);

					$('.sidebar-panel-content, #sidebar-scroll-wrapper').on('scroll', this, this.on_scroll);

					this.trigger('focus');
				},
				// Note that closing dropdown is in global-event-handlers.js

				on_scroll: function(e) {
					var me = e.data;
					me.$el.find('.upfront-field-select').removeClass('upfront-field-select-expanded');
					me.trigger('blur');
				},
				onMouseUp: function(e){
					e.stopPropagation();
				},

				onChange: function() {
					this.update_select_display_value();
					this.trigger('changed', this.get_value());
				},

				selected_state: 'checked',

				className: 'upfront-field-wrap upfront-field-wrap-select',

				render: function () {
					this.$el.html('');

					if ( this.label ) {
						this.$el.append(this.get_label_html());
					}
					this.$el.append(this.get_field_html());

					this.stop_scroll_propagation(this.$el.find('.upfront-field-select-options'));

					if ( ! this.multiple && ! this.get_saved_value() ) {
						this.$el.find('.upfront-field-select-option:eq(0) input').prop('checked', true);
					}

					this.update_select_display_value();

					if ( this.options.width ) {
						this.$el.find('.upfront-field-select').css('width', this.options.width);
					}

					if (this.options.additional_classes) {
						this.$el.addClass(this.options.additional_classes);
					}

					this.trigger('rendered');
				},

				update_select_display_value: function() {
					var select_label = ( this.options.select_label ) ? this.options.select_label : ( this.options.placeholder ? this.options.placeholder : '' );
					var $select_value = this.$el.find('.upfront-field-select-value');
					var $checked = this.$el.find('.upfront-field-select-option input:checked');
					if ( $checked.length == 1 && !this.multiple ) {
						var $option = $checked.closest('.upfront-field-select-option'),
							select_text = $option.text(),
							$select_icon = $option.find('.upfront-field-icon').clone();
						$select_value.html('');
						if ( $select_icon )
							$select_value.append($select_icon);
						$select_value.append('<span>'+select_text+'</span>');
					} else {
						var select_texts = [];
						$checked.each(function(){
							select_texts.push( $(this).closest('.upfront-field-select-option').text() );
						});
						$select_value.text( 0 === $checked.length ? select_label : select_texts.join(', ') );
					}
					this.$el.find('.upfront-field-select-option').each(function(){
						if ( $(this).find('input:checked').length > 0 )
							$(this).addClass('upfront-field-select-option-selected');
						else
							$(this).removeClass('upfront-field-select-option-selected');
					});
				},
				get_field_html: function () {
					var attr = {
						'class': 'upfront-field-select upfront-no-select',
						'id': this.get_field_id()
					};
					attr['class'] += ' upfront-field-select-' + ( this.options.multiple ? 'multiple' : 'single' );
					if ( this.options.disabled )
							attr['class'] += ' upfront-field-select-disabled';
					if ( this.options.style == 'zebra' )
							attr['class'] += ' upfront-field-select-zebra';
					//return '<select ' + this.get_field_attr_html(attr) + '>' + this.get_values_html() + '</select>';
					return '<div ' + this.get_field_attr_html(attr) + '><div class="upfront-field-select-value"></div><ul class="upfront-field-select-options">' + this.get_values_html() + '</ul></div>';
				},
				get_value_html: function (value, index) {
					var id = this.get_field_id() + '-' + index;
					var attr = {
						'type': ( this.multiple ? 'checkbox' : 'radio' ),
						'id': id,
						'name': this.get_field_name(),
						'class': 'upfront-field-' + ( this.multiple ? 'checkbox' : 'radio' ),
						'value': value.value
					};
					var saved_value = this.get_saved_value();
					var classes = 'upfront-field-select-option';
					if ( value.disabled ) {
						attr.disabled = 'disabled';
						classes += ' upfront-field-select-option-disabled';
					}
					var icon_class = this.options.icon_class ? this.options.icon_class : null;
					if ( this.multiple && _.contains(saved_value, value.value) )
						attr.checked = 'checked';
					else if ( ! this.multiple && saved_value == value.value )
						attr.checked = 'checked';
					if ( attr.checked )
						classes += ' upfront-field-select-option-selected';
					classes += ' upfront-field-select-option-' + ( 0 === index%2 ? 'odd' : 'even' );
					//return '<option ' + this.get_field_attr_html(attr) + '>' + value.label + '</option>';
					var input = '<input ' + this.get_field_attr_html(attr) + ' />';
					return '<li class="' + classes + '">' + '<label for="' + id + '">' + this.get_icon_html(value.icon, icon_class) + '<span class="upfront-field-label-text">' + value.label + '</span></label>' + input + '</li>';
				}
		}));

		var Field_Chosen_Select = Field_Select.extend({
				events: {
					'change select': 'on_change',
					'click .chosen-container .chosen-single': 'openOptions'
				},
				multiple: false,

				initialize: function(options) {
					this.options = options;
					Field.prototype.initialize.call(this, options);
				},

				render: function () {
					var me = this;

					this.$el.html('');

					if ( this.label ) {
						this.$el.append(this.get_label_html());
					}
					this.$el.append(this.get_field_html());

					this.stop_scroll_propagation(this.$el.find('.upfront-field-select-options'));

					if ( ! this.multiple && ! this.get_saved_value() ) {
						this.$el.find('.upfront-field-select-option:eq(0) input').prop('checked', true);
					}

					this.update_select_display_value();

					if ( this.options.width ) {
						this.$el.find('.upfront-field-select').css('width', this.options.width);
					}

					if (this.options.additional_classes) {
						this.$el.addClass(this.options.additional_classes);
					}

					this.$el.find('select').on('chosen:hiding_dropdown', function() {
						me.allowMouseWheel();
					});

					this.trigger('rendered');
				},

				get_field_html: function() {
					var multiple = this.multiple ? 'multiple' : '';
					return ['<select class="upfront-chosen-select"' , multiple, ' data-placeholder="', this.options.placeholder,  '">', this.get_values_html(), '</select>'].join('');
				},
				get_value_html: function (value, index) {
					var selected = '';
					if (value.value === this.options.default_value) selected = ' selected="selected"';
					return ['<option value="', value.value, '"', selected, '>', value.label, '</option>'].join('');
				},
				on_change: function(e) {
					this.allowMouseWheel();
					this.$el.find('.chosen-drop').css('display', 'none');
					this.trigger('changed');
				},
				get_value: function() {
					return this.$el.find('select').val();
				},
				set_value: function(value) {
					this.$el.find('select').val(value).trigger('chosen:updated');
				},
				openOptions: function(e) {

					//Disable scroll when chosen is opened
					$('.sidebar-panel-content .sidebar-tab-content, #sidebar-scroll-wrapper').bind('mousewheel', function() {
						return false;
					});

					var me = this;
					_.delay(function() { // Delay because opening animation causes wrong outerHeight results
						var in_sidebar = me.$el.parents('#sidebar-ui').length,
							in_settings = me.$el.parents('#element-settings-sidebar').length,
							settingsTitleHeight = 44
						;

						// Apply if select field is in sidebar or settings sidebar
						if(in_sidebar == 1 || in_settings == 1) {
							var select_dropdown = me.$el.find('.chosen-drop'),
								select = select_dropdown.parent(),
								dropDownTop = (select.offset().top - $('#element-settings-sidebar').offset().top) + select.height();
								dropDownTop = dropDownTop + settingsTitleHeight
							;

							select_dropdown.css("width", select.width());
							select_dropdown.css('top', dropDownTop + "px");
							select_dropdown.css('left', select.offset().left + "px");
							select_dropdown.css('display', 'block');
						}
					}, 20);
	
	//Close dropdown on parent scroll
					$('.sidebar-panel-content, #sidebar-scroll-wrapper').on('scroll', this, this.closeChosen);

					me.$el.find('.chosen-drop').show();
					// style differently than when closed.
					this.$el.addClass('upfront-field-wrap-select-expanded');
				},
				closeChosen: function(e) {
					var me = e.data;
					var in_sidebar = me.$el.parents('#sidebar-ui').length,
						in_settings = me.$el.parents('#element-settings-sidebar').length;

					if(in_sidebar == 1 || in_settings == 1) {
						me.$el.find('.chosen-drop').css('display', 'none');
					}
					// style differently than when closed.
					me.$el.removeClass('upfront-field-wrap-select-expanded');
					me.$el.find('select').trigger("chosen:close");

					me.allowMouseWheel();
				},
				allowMouseWheel: function() {
					//Enable scroll when chosen is closed
					$('.sidebar-panel-content .sidebar-tab-content, #sidebar-scroll-wrapper').unbind('mousewheel');
				}
		});

		var Field_Typeface_Chosen_Select = Field_Chosen_Select.extend({
			events: {
				'change select': 'on_change',
				'click .chosen-container .chosen-single': 'openOptions'
			},
			multiple: false,
			get_field_html: function() {
				var multiple = this.multiple ? 'multiple' : '';
				return ['<div class="upfront-select-font"><select class="upfront-chosen-select-typeface"' , multiple, ' data-placeholder="', this.options.placeholder,  '">', this.get_values_html(), '</select></div>'].join('');
			},
			get_value_html: function (value, index) {
				var selected = '';
				var saved_value = this.get_saved_value();
				if (value.value === saved_value) {
					selected = ' selected="selected"';
				}
				return ['<option value="', value.value, '"', selected, ' style="font-family: ', value.value ,'">', value.label, '</option>'].join('');
			},
			render: function() {
				Field_Chosen_Select.prototype.render.call(this);

				var me = this;
				$('.upfront-chosen-select-typeface', this.$el).chosen({
					width: this.options.select_width
				});

				//Wait for Chosen to be initialized
				setTimeout(function(){
					me.set_option_font(me.get_saved_value());
				}, 50);
			},
			on_change: function(event) {
				this.trigger('changed', this.get_value());
				this.$el.find('.chosen-drop').css('display', 'none');
				this.set_option_font(this.get_value());
			},
			set_option_font: function(value) {
				this.$el.find('.chosen-single').css( "font-family", value );
			},
			openOptions: function(e) {
				Field_Chosen_Select.prototype.openOptions.call(this);
			}
		});

		var Field_Typeface_Style_Chosen_Select = Field_Chosen_Select.extend({
			events: {
				'change select': 'on_change',
				'click .chosen-container .chosen-single': 'openOptions'
			},
			multiple: false,
			get_field_html: function() {
				var multiple = this.multiple ? 'multiple' : '';
				return ['<div class="upfront-select-font"><select class="upfront-chosen-select-style"' , multiple, ' data-placeholder="', this.options.placeholder,  '">', this.get_values_html(), '</select></div>'].join('');
			},
			get_value_html: function (value, index) {
					var selected = '';
					var font_family = this.options.font_family;
					var parsed_variant = Upfront.Views.Font_Model.parse_variant(value.value);
					var saved_value = this.get_saved_value();
					if (value.value === saved_value) {
							selected = ' selected="selected"';
					}
					var label =  this.map_labels(parsed_variant.weight, parsed_variant.style);
					return ['<option value="', value.value, '"', selected, ' style="font-family: ', font_family ,'; font-weight: ', parsed_variant.weight ,'; font-style: ', parsed_variant.style ,' ">', label, '</option>'].join('');
			},
			render: function() {
				Field_Chosen_Select.prototype.render.call(this);

				var me = this;
				$('.upfront-chosen-select-style', this.$el).chosen({
					width: this.options.select_width,
					disable_search: true
				});

				//Wait for Chosen to be initialized
				setTimeout(function(){
					me.set_option_font(me.get_saved_value());
				}, 50);

			},
			map_labels: function(weight, style) {
				//Map font weight to labels
				var label, labels = {
					'100': l10n.label_thin,
					'200': l10n.label_extra_light,
					'300': l10n.label_light,
					'400': l10n.label_regular,
					'500': l10n.label_medium,
					'600': l10n.label_semi_bold,
					'700': l10n.label_bold,
					'800':  l10n.label_extra_bold,
					'900': l10n.label_ultra_bold
				};

				//Check if weight is number or string
				if (!_.isUndefined( weight ) && weight.match(/^(\d+)/)) {
					label = labels[weight];
				} else {
					label = weight;
				}

				//Display style only if style is Italic
				if(style == "italic") {
					label += ' ' + style;
				}

				return label;
			},
			on_change: function(event) {
				this.trigger('changed', this.get_value());
				this.$el.find('.chosen-drop').css('display', 'none');
				this.set_option_font(this.get_value());
			},
			set_option_font: function(value) {
				var font_family = this.$el.parent().parent().find('.upfront-chosen-select-typeface').val();
				var parsed_variant = Upfront.Views.Font_Model.parse_variant(value);
				this.$el.find('.chosen-single').css( {"font-family": font_family, "font-weight": parsed_variant.weight, "font-style": parsed_variant.style });
			},
			openOptions: function(e) {
				Field_Chosen_Select.prototype.openOptions.call(this);
			}
		});

		var Field_Multiple_Chosen_Select = Field_Chosen_Select.extend({
			events: {
				'change select': 'on_change',
				'click .chosen-container-multi': 'openOptions'
			},
			multiple: true,
			get_field_html: function() {
				var multiple = this.multiple ? 'multiple' : '';
				return ['<select class="upfront-chosen-select-multiple"' , multiple, ' data-placeholder="', this.options.placeholder,  '">', this.get_values_html(), '</select>'].join('');
			},
			get_value_html: function (value, index) {
				var selected = '';
				var saved_value = this.get_saved_value();
				if (_.contains(saved_value, value.value) ) {
					selected = ' selected="selected"';
				}
				return ['<option value="', value.value, '"', selected, '>', value.label, '</option>'].join('');
			},
			render: function() {
				Field_Chosen_Select.prototype.render.call(this);

				var me = this;
				$('.upfront-chosen-select-multiple', this.$el).chosen({
						width: this.options.select_width
				});

			},
			on_change: function(event) {
				this.trigger('changed', this.get_value());
				this.$el.find('.chosen-drop').css('display', 'none');
			},
			openOptions: function(e) {
				Field_Chosen_Select.prototype.openOptions.call(this);
			}
		});

		var Field_Multiple_Input = Field_Multiple.extend({
				selected_state: 'checked',
				render: function () {
					var me = this;

					this.$el.html('');

					if ( this.label ) {
						this.$el.append(this.get_label_html());
					}

					this.$el.append(this.get_field_html());

					this.$el.on('change', '.upfront-field-multiple input', function(){
						me.$el.find('.upfront-field-multiple').each(function(){
							if ( $(this).find('input:checked').size() > 0 ) {
									$(this).addClass('upfront-field-multiple-selected');
							} else {
									$(this).removeClass('upfront-field-multiple-selected');
							}
						});

						me.trigger('changed', me.get_value());
					});

					this.trigger('rendered');
				},
				get_field_html: function () {
					return this.get_values_html();
				},
				get_value_html: function (value, index) {
					var id = this.get_field_id() + '-' + index;
					var classes = "upfront-field-multiple";
					var attr = {
						'type': this.type,
						'id': id,
						'name': this.get_field_name(),
						'value': value.value,
						'class': 'upfront-field-' + this.type
					};
					var saved_value = this.get_saved_value();
					var icon_class = this.options.icon_class ? this.options.icon_class : null;
					if ( this.options.layout ) classes += ' upfront-field-multiple-'+this.options.layout;
					if ( value.disabled ) {
						attr.disabled = 'disabled';
						classes += ' upfront-field-multiple-disabled';
					}
					if ( this.multiple && _.contains(saved_value, value.value) ) {
						attr.checked = 'checked';
					} else if ( ! this.multiple && saved_value == value.value ) {
						attr.checked = 'checked';
					}
					if (value.checked) attr.checked = 'checked';
					if ( attr.checked ) {
						classes += ' upfront-field-multiple-selected';
					}
					return '<span class="' + classes + '"><input ' + this.get_field_attr_html(attr) + ' />' + '<label for="' + id + '">' + this.get_icon_html(value.icon, icon_class) + '<span class="upfront-field-label-text">' + value.label + '</span></label></span>';
				}
		});

		var Field_Radios = Field_Multiple_Input.extend({
			className: 'upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios',
			type: 'radio'
		});

		var Field_Checkboxes = Field_Multiple_Input.extend({
			className: 'upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-checkboxes',
			type: 'checkbox',
			multiple: true
		});

		var OptionalField = Field_Checkboxes.extend({
			className: 'upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-checkboxes upfront-field-wrap-optional',
			events: {
				'change input': 'onChange'
			},

			initialize: function(opts){
				var me = this;
				OptionalField.__super__.initialize.apply(this, arguments);

				this.options = opts;

				this.on('panel:set', function(){
					this.panel.on('rendered', function(){
						me.onChange();
					});
				});

				if(opts.onChange) this.onChange = opts.onChange;
			},

			onChange: function(){
				var check = this.$('input'),
					related = this.panel.$('input[name=' + this.options.relatedField + ']').closest('.upfront-field-wrap')
				;
				if(check.is(':checked')) {
					related.show();
				} else {
					related.hide();
				}

				$('#settings').height(this.panel.$('.upfront-settings_panel').outerHeight());
				this.model.set_property(this.options.property, this.get_value());
			}
		});

		var Field_Multiple_Suggest = Field.extend(_.extend({}, Mixins.Upfront_Scroll_Mixin, {
			events: {
				"click .upfront-suggest-add": "add_list",
				"focus .upfront-field-text-suggest": "reveal_suggest",
				"keyup .upfront-field-text-suggest": "update_suggest"
			},
			multiple: true,
			selected_state: 'checked',
			added_list: [],
			checked_list: [],
			suggest_list: [],
			render: function () {
				var me = this;
				this.$el.html('');
				if ( this.label ) this.$el.append(this.get_label_html());
				this.$el.append('<div class="upfront-suggest-wrap" />');
				var $wrap = this.$el.find('.upfront-suggest-wrap');
				$wrap.append(this.get_field_html());
				$wrap.append('<div class="upfront-suggest-list-wrap upfront-no-select" />');
				this.checked_list = this.get_saved_value();
				var $list_wrap = this.$el.find('.upfront-suggest-list-wrap');
				$list_wrap.append('<ul class="upfront-suggest-lists">' + this.get_suggest_list_html() + '</ul>');
				$list_wrap.append('<div class="upfront-suggest-add-wrap"><span class="upfront-suggest-add-value"></span><span class="upfront-suggest-add">' + l10n.add_new + '</span></div>');
				this.stop_scroll_propagation(this.$el.find('.upfront-suggest-lists'));
				this.$el.on('change', '.upfront-suggest-list input', function () {
					var value = $(this).val();
					if ( !$(this).is(':checked') && _.contains(me.checked_list, value) ) {
						me.checked_list = _.without(me.checked_list, value);
					} else {
						me.checked_list.push(value);
					}
					me.trigger('changed');
				});
				this.$el.on('click', function (e) {
					e.stopPropagation();
				});
				$('#settings').on('click', '.upfront-settings_panel', function(){
					me.$el.find('.upfront-suggest-list-wrap').removeClass('upfront-suggest-list-wrap-expanded');
				});

				this.trigger('rendered');
			},
			reveal_suggest: function () {
				this.$el.find('.upfront-suggest-list-wrap').addClass('upfront-suggest-list-wrap-expanded');
				this.update_suggest();
			},
			update_suggest: function () {
				var value = this.get_field_input_value();
				this.$el.find('.upfront-suggest-lists').html(this.get_suggest_list_html());
				if ( value ){
					this.$el.find('.upfront-suggest-add-wrap').show();
					this.$el.find('.upfront-suggest-add-value').text(value);
					this.$el.find('.upfront-suggest-add').toggle( !(_.contains(this.suggest_list, value)) );
				}
				else {
					this.$el.find('.upfront-suggest-add-wrap').hide();
				}
			},
			get_field_html: function () {
				var attr = {
					'type': 'text',
					'class': 'upfront-field upfront-field-text upfront-field-text-suggest',
					'id': this.get_field_id()
				};
				if ( this.options.placeholder ) attr['placeholder'] = this.options.placeholder;
				return '<input ' + this.get_field_attr_html(attr) + ' />';
			},
			get_suggest_list_html: function () {
				var value = this.get_field_input_value();
				var rgx = value ? new RegExp('('+value+')', 'ig') : false;
				var lists = this.get_suggest_list(rgx);
				var me = this;
				return _.map(lists, function(list, index){
					var id = me.get_field_id() + '-' + index;
					var attr = {
						'type': 'checkbox',
						'id': id,
						'name': me.get_field_name(),
						'value': list,
						'class': 'upfront-field-checkbox'
					};
					if ( _.contains(me.checked_list, list) ) attr.checked = 'checked';
					var label = rgx ? list.replace(rgx, '<span class="upfront-suggest-match">$1</span>') : list;
					return '<li class="upfront-suggest-list"><input ' + me.get_field_attr_html(attr) + ' /><label for="' + id + '">' + label +'</label></li>';
				}).join('');
			},
			get_suggest_list: function (rgx) {
				var suggest = [];
				_.each([this.options.source, this.added_list, this.get_saved_value()], function(list, index){
					_.each(list, function(value){
						if ( !( index == 2 && _.contains(suggest, value) ) && ( ( rgx && value.match(rgx) ) || !rgx ) ) {
							suggest.push(value);
						}
					});
				});
				this.suggest_list = suggest;
				return suggest;
			},
			get_field_input_value: function () {
				return this.$el.find('#'+this.get_field_id()).val();
			},
			empty_field_input_value: function () {
				return this.$el.find('#'+this.get_field_id()).val('');
			},
			add_list: function (e) {
				var value = this.get_field_input_value();
				this.added_list.push(value);
				this.checked_list.push(value);
				this.empty_field_input_value();
				this.update_suggest();
			}
		}));

		var Field_Anchor = Field_Select.extend({
			initialize: function (opts) {
				Field_Select.prototype.initialize.call(this, opts);
				this.options.values = this.get_anchors();
			},
			get_anchors: function () {
				var raw = Settings_AnchorTrigger.prototype.get_anchors.call(this),
					anchors = []
				;
				_(raw).each(function (idx) {
					anchors.push({label: idx, value: idx});
				});
				return anchors;
			}
		});

		/**
		 * This is ordinary select that will render first option as label which
		 * is disabled, has no hover effect and has no value.
		 * Specify label text with options.label_text
		 */
		var Field_Compact_Label_Select_Option = Backbone.View.extend({
			tagName: 'li',
			events: {
				'change input': 'on_change'
			},
			className: function() {
				var className = 'upfront-field-select-option';
				if (this.model.get('default')) className += ' upfront-field-select-option-disabled';
				if (this.model.get('enabled')) className += ' upfront-field-select-option-selected';
				// select-option-odd
				return className;
			},
			template: '<label><span class="upfront-field-label-text">{{ name }} {[ if (width > 0) { ]}({{width}}px){[ } ]}</span></label>' +
			'<input type="checkbox" class="upfront-field-checkbox" value="{{ id }}" ' +
			'{[ if (is_default) { ]} disabled="disabled"{[ } ]}' +
			'{[ if (enabled) { ]} checked="checked"{[ } ]}>',
			initilize: function(options) {
				this.options = options || {};
				this.listenTo(this.model, 'change', this.render);
			},
			on_change: function(event) {
				this.model.set({'enabled': this.$el.find('input').is(':checked')});
			},
			render: function() {
				var properties = this.model.toJSON();
				// "default" is reserved word can't use it in template rendering. //todo fix this in model
				properties.is_default = properties['default'];
				this.$el.append(_.template(this.template, properties));
				return this;
			}
		});
		var Field_Compact_Label_Select = Field_Select.extend({
			className: 'upfront-field-select upfront-no-select upfront-field-compact-label-select',
			template: '' +
			'<ul class="upfront-field-select-options">' +
			'<li class="upfront-field-select-option">' +
			'<label><span class="upfront-field-label-text">{{ label_text }}</span></label>' +
			'</li>' +
			'</ul></div>' +
			'',

			initialize: function(options) {
				this.options = options || {};
				this.listenTo(this.collection, 'add remove change:name change:width', this.render);
			},

			render: function () {
				var me = this;
				this.$el.html('');
				this.$el.append(_.template(this.template, this.options));
				this.$el.addClass(' upfront-field-select-' + ( this.options.multiple ? 'multiple' : 'single' ));

				if (this.options.disabled) {
					this.$el.addClass('upfront-field-select-disabled');
				}

				if (this.options.style == 'zebra') {
					this.$el.addClass('upfront-field-select-zebra');
				}

				// Add option views
				_.each(this.collection.models, function(breakpoint) {
					var option = new Field_Compact_Label_Select_Option({ model: breakpoint });
					option.render();
					this.$el.find('ul').append(option.el);
				}, this);
			},

			onOptionClick: function (e) {
				this.$el.toggleClass('compact-label-select-open');
				Field_Select.prototype.onOptionClick.call(this, e);
			}
		});

		var Field_Complex_Toggleable_Text_Field = Field.extend({
			className: "upfront-field-complex_field-boolean_toggleable_text upfront-field-multiple",
			tpl: '<input type="checkbox" class = "upfront-field-checkbox" /> <label><span class="upfront-field-label-text">{{element_label}}</span></label> <div class="upfront-embedded_toggleable" style="display:none">{{field}}<div class="upfront-embedded_toggleable-notice">' + l10n.anchor_nag + '</div></div>',
			initialize: function (opts) {
				Field.prototype.initialize.call(this, opts);
				this.options.field = new Field_Text(this.options);
			},
			render: function () {
				var me = this;
				this.$el.empty();
				this.$el.append(this.get_field_html());

				this.$el.on("click", ':checkbox', function (e) {
					e.stopPropagation();
					me.field_toggle.apply(me);
				});
				if (this.model.get_property_value_by_name(this.options.field.get_name())) {
					this.$el.find(':checkbox').attr("checked", true);
					this.check_value();
					this.field_toggle();
				}

				this.$el.on("keyup", '[name="' + this.options.field.get_name() + '"]', function (e) {
					e.stopPropagation();
					me.check_value.apply(me);
				});

				setTimeout(function () {
					me.trigger("anchor:updated");
				}, 50);
			},
			field_toggle: function () {
				if (this.$el.find(":checkbox").is(":checked")) {
					this.$el.find(".upfront-embedded_toggleable").show();
				} else {
					this.$el.find(".upfront-embedded_toggleable").hide();
				}
				this.property.set({value: this.get_value()});
				this.trigger("anchor:updated");
			},
			check_value: function () {
				var $field = this.$el.find('[name="' + this.options.field.get_name() + '"]'),
					$root = this.$el.find(".upfront-embedded_toggleable"),
					val = $field.length && $field.val ? $field.val() : ''
				;
				$root.removeClass("error").removeClass("ok");
				if (val.length && !val.match(/^[a-zA-Z]+$/)) {
					$root.addClass("error");
				} else if (val.length) {
					$root.addClass("ok");
				}
				this.property.set({value: this.get_value()});
			},
			get_field_html: function () {
				this.options.field.render();
				var $input = this.options.field.$el;
				return _.template(this.tpl, _.extend({}, this.options, {field: $input.html()}));
			},
			get_value: function () {
				var data = {},
					$field = this.$el.find(":checkbox"),
					$subfield = this.$el.find('[name="' + this.options.field.get_name() + '"]'),
					value = $subfield.val().replace(/[^a-zA-Z]/g, '')
				;
				return $field.is(":checked") && value ? value : ''; // was false
			}
		});

		return {
			"Field": Field,
			"Text": Field_Text,
			"Title": Field_Title,
			"Button": Field_Button,
			"Email": Field_Email,
			"Textarea": Field_Textarea,
			"Color": Field_Color,
			"Multiple_Suggest": Field_Multiple_Suggest,
			"Chosen_Select": Field_Chosen_Select,
			"Typeface_Chosen_Select": Field_Typeface_Chosen_Select,
			"Typeface_Style_Chosen_Select": Field_Typeface_Style_Chosen_Select,
			"Multiple_Chosen_Select": Field_Multiple_Chosen_Select,
			"Number": Field_Number,
			"Slider": Field_Slider,
			"Select": Field_Select,
			"Radios": Field_Radios,
			"Checkboxes": Field_Checkboxes,
			"Hidden": Field_Hidden,
			"Anchor": Field_Anchor,
			"Optional": OptionalField,
			Field_Compact_Label_Select_Option: Field_Compact_Label_Select_Option,
			Field_Compact_Label_Select: Field_Compact_Label_Select,
			Field_Complex_Toggleable_Text_Field: Field_Complex_Toggleable_Text_Field,
			ToggleableText: Field_ToggleableText
		};
	});
}(jQuery));
