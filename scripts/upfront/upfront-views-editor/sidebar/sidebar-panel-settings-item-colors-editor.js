(function($){
	var l10n = Upfront.Settings && Upfront.Settings.l10n
		? Upfront.Settings.l10n.global.views
		: Upfront.mainData.l10n.global.views
		;
	define([
			"scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-item",
			"scripts/upfront/upfront-views-editor/theme-colors",
			'scripts/upfront/upfront-views-editor/fields',
			"text!upfront/templates/sidebar_settings_theme_colors.html"
	], function ( SidebarPanel_Settings_Item, Theme_Colors, Fields, sidebar_settings_theme_colors_tpl ) {

		return SidebarPanel_Settings_Item.extend({
			// Cache for calculated color styles
			color_styles: [],
			initialize : function(){
				var self = this;
				this.template = _.template(sidebar_settings_theme_colors_tpl);
				// Sidebar initializes twice, first time model is empty, to prevent zombie copy of this reacting to events
				// check if model is empty and do not subscribe to events.
				if (this.model.get('properties').length === 0) return;

				// Clear old events
				Upfront.Events.off("command:layout:save", this.on_save);
				Upfront.Events.off("command:layout:save_as", this.on_save);

				// Rebind events
				Upfront.Events.on("command:layout:save", this.on_save, this);
				Upfront.Events.on("command:layout:save_as", this.on_save, this);

				if (Upfront.Settings.Application.NO_SAVE) Upfront.Events.on("preview:build:start", this.on_save, this); // Also build colors on preview, only in anonymous mode
				// Somehow update styles get triggered 4 times in a row, making editor freeze for a while.
				// Until I find time to fix this properly, here we go with debounce.
				this.update_styles_debounced = _.debounce(this.update_styles, 500);
				this.update_styles_debounced();
				Theme_Colors.colors.bind('change reset add', this.update_styles_debounced, this);
			},
			events : {
				"change .panel-setting-theme-colors-shades-range": "change_range",
				"click .theme-colors-color-box" : "select_variation"
			},
			on_save : function(){
				Upfront.Application.colorSaver.queue([
					Theme_Colors.colors.toJSON(),
					Theme_Colors.range,
					this.styles
				]);
			},
			/**
			 * Checks if color style was generated at least once for theme color with given index.
			 * @param {Number} - theme color index
			 * @return {Boolean} - if style is generated at least once
			 */
			color_style_is_initialized: function(index) {
				return typeof this.color_styles[index] !== 'undefined';
			},
			/**
			 * Checks if color has been changed since editor was loaded.
			 * @param {Object} model - theme color model
			 * @return {Boolean} if color is original
			 */
			color_is_original: function(model) {
				return typeof model.previous('prev') === 'undefined';
			},
			/**
			 * Checks if color has new value set in theme color editor UI.
			 * @param {Object} model - theme color model
			 * @param {String} color - normalized theme color
			 * @return {Boolean} if color is updated
			 */
			color_is_updated: function(model, color) {
				// Look in previous for prev value, because at this point both prev and color have same value in attributes
				return this.color_is_original(model) === false && model.previous('prev') !== color;
			},
			/**
			 * Normalizes theme color value.
			 * @param {Object} model - theme color model
			 * @return {String} normalized color value
			 */
			theme_color_to_string: function(model) {
				return model.get("color") === '#000000' && model.get("alpha") === 0 ? 'inherit' : model.get("color");
			},
			/**
			 * Generates theme color style from theme color.
			 * @param {Object} model - theme color model
			 * @param {Number} - theme color index
			 * @param {String} color - normalized color value
			 * @return {String} theme color style
			 */
			generate_theme_color_style: function(model, index, color) {
				var style = '';
				var hovcol = model.get_hover_color();

				style += " .upfront_theme_color_" + index +"{ color: " + color + ";}";
				style += " a .upfront_theme_color_" + index +":hover{ color: " + hovcol + ";}";
				style += " button .upfront_theme_color_" + index +":hover{ color: " + hovcol + ";}";
				style += " .upfront_theme_bg_color_" + index +"{ background-color: " + color + ";}";
				style += " a .upfront_theme_bg_color_" + index +":hover{ background-color: " + hovcol + ";}";
				style += " button .upfront_theme_bg_color_" + index +":hover{ background-color: " + hovcol + ";}";

				return style;
			},
			update_styles : function(){
				var self = this;
				Theme_Colors.colors.each(function( item, index ){
					var color = self.theme_color_to_string(item);
					// Only do this (very expansive DOM changes) if color is actually updated or
					// styles need to be initialized!!!
					if (false === self.color_is_updated(item, color) && self.color_style_is_initialized(index)) return;

					self.color_styles[index] = self.generate_theme_color_style(item, index, color);
					Upfront.Util.colors.update_colors_in_dom(item.get("prev"), color, index);

					// Now update previous prev value (a bit hacky but what can one do)
					item._previousAttributes.prev = color;
				});

				this.styles = this.color_styles.join(' ');
				$("#upfront_theme_colors_dom_styles").remove();
				$("<style id='upfront_theme_colors_dom_styles' type='text/css'>" + this.styles + "</style>").appendTo("body");

				Upfront.Events.trigger("theme_colors:update");
			},
			on_render : function(){
				var self = this,
				unset_color_index;
				this.theme_colors = Theme_Colors;
				this.theme_color_range = Theme_Colors.range;
				this.$el.html( this.template({
					colors :  this.theme_colors.colors.toJSON(),
					range  :  Theme_Colors.range
				} ) );

				//if( this.theme_colors.colors.length < 10 ){
				//    this.add_empty_picker(this.theme_colors.colors.length);
				//}
				this.add_previous_pickers();
				unset_color_index = this.theme_colors.colors.length;
				while( unset_color_index < 10 ){
					this.add_unset_color(unset_color_index);
					unset_color_index++;
				}

				this.add_slider();
			},
			add_empty_picker : function(index){
				var self = this,
				empty_picker = new Fields.Color({
					className : 'upfront-field-wrap upfront-field-wrap-color sp-cf theme_color_swatch theme_color_swatch_empty',
					hide_label : true,
					default_value: '#ffffff',
					hide_alpha: true,
					blank_alpha: 0,
					spectrum: {
						choose: function (color) {
							if (!_.isObject(color)) return false;
							var value = empty_picker.get_value();
							if (value && "undefined" !== typeof tinycolor) {
								color = tinycolor(value);
							}
							self.add_new_color(color, index);
						},
						change: function (color) {
							if (!_.isObject(color)) return false;
							empty_picker.update_input_val(color.toHexString());
						}
					}
				});
				empty_picker.render();
				this.$(".theme_colors_empty_picker").html(empty_picker.$el);
			},
			add_unset_color : function(index){
				var self = this,
				empty_picker = new Fields.Color({
					className : 'upfront-field-wrap upfront-field-wrap-color sp-cf theme_color_swatch',
					hide_label : true,
					default_value: '#ffffff', // Need to not be transparent, because theme colors can't be transparent
					hide_alpha: true,
					blank_alpha: 0,
					ufc_index: index,
					spectrum: {
						choose: function (color) {
							if (!_.isObject(color)) return false;
							var value = empty_picker.get_value();
							if (value && "undefined" !== typeof tinycolor) {
								color = tinycolor(value);
							}
							self.add_new_color(color, index);
						},
						change: function (color) {
							if (!_.isObject(color)) return false;
							empty_picker.update_input_val(color.toHexString());

							// Decide whether to update or to add the new color
							if (self.theme_colors.colors.at(index)) {
								self.update_colors(this, color, index);
							} else {
								self.add_new_color(color, index); // Need to actually add a color here, as it won't be otherwise
								self.update_colors(this, color, index); // And to update too because hail satan
							}
							// Done
						}
					}
				});
				empty_picker.render();

				empty_picker.$(".sp-preview").addClass("uf-unset-color");
				empty_picker.$(".sp-replacer").addClass("uf-unset-color-wrapper");

				this.$('#theme-colors-swatches').append( empty_picker.$el );
				empty_picker.$el.wrap( '<span class="theme-colors-color-picker color-index">'.replace( "index", index) );
			},
			add_previous_pickers : function(){
				var self = this;
				this.$(".theme-colors-color-picker").each(function(index){
					var $this = $(this),
					color = $this.data("color"),
					model = self.theme_colors.colors.at(index),
						picker = new Fields.Color({
							className : 'upfront-field-wrap upfront-field-wrap-color sp-cf theme_color_swatch',
							hide_label : true,
							default_value: color,
							hide_alpha: true,
							blank_alpha: 0,
							ufc_index: index,
							spectrum: {
								change: function (color) {
									self.update_colors(this, color, index);
								},
								move: function (color) {
									picker.$(".sp-preview").css({
										backgroundColor : color.toRgbString(),
										backgroundImage : "none"
									});
								},
								hide: function (color) {
									picker.$(".sp-preview").css({
										backgroundColor : color.toRgbString(),
										backgroundImage : "none"
									});
								}
							}
						});
					picker.render();
					picker.$(".sp-preview").css({
						backgroundColor : color,
						backgroundImage : "none"
					});
					if( model.get( 'color' ) === '#000000' && model.get( 'alpha' ) == 0 ) {
						picker.$(".sp-preview").addClass( 'uf-unset-color' );
						picker.$(".sp-replacer").addClass("uf-unset-color-wrapper");
					}
					else {
						picker.$(".sp-preview").removeClass( 'uf-unset-color' );
						picker.$(".sp-replacer").removeClass("uf-unset-color-wrapper");
					}

					$this.html( picker.$el );
				});
			},
			add_new_color : function( color, index ){
				var percentage = parseInt( Theme_Colors.range, 10) / 100 || 0;
				/**
				 * If slots before the 'index' are empty, fill them up with rgba(0,0,0, 0)
				 * This will make sure the 'color' remains at the 'index'
				 **/
				for ( var __next_index = this.theme_colors.colors.length; __next_index < index; __next_index++ ) {
					this.theme_colors.colors.push({
						color : "#000000",
						prev : "#000000",
						highlight : "#000000",
						shade : "#000000",
						alpha: 0
					});
				}

				var self = this,
					model = this.theme_colors.colors.add({
						color : color.toHexString(),
						prev : color.toHexString(),
						highlight : self.color_luminance( color.toHex(), percentage ),
						shade : self.color_luminance( color.toHex(), (percentage * -1) ),
						alpha: color.alpha
					}),
					new_color_picker = new Fields.Color({
						className : 'upfront-field-wrap upfront-field-wrap-color sp-cf theme_color_swatch theme-colors-color-picker',
						hide_label : true,
						default_value: color.toRgbString(),
						hide_alpha: true,
						blank_alpha: 0,
						change: function (color){
							var percentage = parseInt( Theme_Colors.range, 10) / 100 || 0;
							color = tinycolor( color );
							model.set({
								color : color.toHexString(),
								highlight : self.color_luminance( color.toHex(), percentage ),
								shade : self.color_luminance( color.toHex(), (percentage * -1) ),
								alpha: color.alpha
							});
							$(this).parent().find(".sp-preview").css({
								backgroundColor : color.toRgbString(),
								backgroundImage : "none"
							});
							this.default_value = color.toRgbString();
							self.render_bottom();
						}
					}),
					colorIndex = Theme_Colors.colors.length - 1,
					$wrapper = $('<span class="theme-colors-color-picker color-' + colorIndex + '" data-index="' + colorIndex + '" data-color="' + color.toHexString() + '"><span class="theme-colors-color-name">ufc' + colorIndex + '</span></span>')
				;

				new_color_picker.render();
				new_color_picker.$(".sp-preview").css({
					backgroundColor : color.toRgbString(),
					backgroundImage : "none"
				});
				if( color.toHexString() === '#000000' && color.alpha == 0 ) {
					new_color_picker.$(".sp-preview").addClass( 'uf-unset-color' );
					new_color_picker.$(".sp-replacer").addClass("uf-unset-color-wrapper");
				}
				else {
					new_color_picker.$(".sp-preview").removeClass( 'uf-unset-color' );
					new_color_picker.$(".sp-replacer").removeClass("uf-unset-color-wrapper");
				}
				$wrapper.append(new_color_picker.$el);

				//this.$(".theme_colors_empty_picker").before($wrapper);
				//this.$(".theme_colors_empty_picker").next().remove();
				//
				//this.$(".theme_colors_empty_picker").find('.theme-colors-color-name').html( 'ufc' + ( colorIndex + 1 ) );
				//
				//this.$(".theme_colors_empty_picker").find('.sp-preview').css({
				//    backgroundColor: 'inherit'
				//});
				//
				//if ( Theme_Colors.colors.length === 10 ) {
				//    this.$(".theme_colors_empty_picker").remove();
				//}
				this.$("#theme-colors-no-color-notice").hide();
				this.render_bottom();
				this.on_save();
			},
			render_bottom : function(){
				return;
				/*
					 this.$(".panel-setting-theme-colors-bottom").html(
					 this.bottomTemplate( {
					 colors : Theme_Colors.colors.toJSON(),
					 range  : Theme_Colors.range
					 } )
					 );
					 this.add_slider();
					 */
			},
			color_luminance : function (hex, lum) {
				// validate hex string
				hex = String(hex).replace(/[^0-9a-f]/gi, '');
				if (hex.length < 6) {
					hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
				}
				lum = lum || 0;
				// convert to decimal and change luminosity
				var rgb = "#", c, i;
				for (i = 0; i < 3; i++) {
					c = parseInt(hex.substr(i*2,2), 16);
					c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
					rgb += ("00"+c).substr(c.length);
				}
				return rgb;
			},
			change_range : function(range){
				var self = this;
				Theme_Colors.range = range;
				percentage = parseInt( range, 10 ) / 100 || 0;
				Theme_Colors.colors.each(function(model){
					var original_color = model.get("color");
					model.set("highlight", self.color_luminance( original_color, percentage ));
					model.set("shade", self.color_luminance( original_color, (percentage * -1) ));
				});
				this.render_bottom();
			},
			select_variation : function(e){
				var self = this,
				$this = $(e.target),
				type = $this.data("type"),
					index = $this.data("index"),
					color = $this.data("color"),
						model = Theme_Colors.colors.at(index);
				if( model.get("selected") ){
					model.set("selected", "");
					model.set("luminance", self.luminance( color ) );
				}else{
					model.set("selected", type);
					model.set("luminance", self.luminance( color ) );
				}
				this.render_bottom();
			},
			luminance : function(color){
				color = color.substring(1);
				var rgb = parseInt(color, 16);
				var r = (rgb >> 16) & 0xff;
				var g = (rgb >>  8) & 0xff;
				var b = (rgb >>  0) & 0xff;

				var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
				return (luma < 80) ? "dark" : "light";
			},
			add_slider : function(){
				var self = this;
				this.$(".panel-setting-theme-colors-shades-range").slider({
					value :  Theme_Colors.range,
					min : 0,
					max : 50,
					change: function( event, ui ) {
						self.change_range(ui.value);
					}
				});
			},
			update_colors : function(picker, color, index){
				var model = Theme_Colors.colors.at(index),
				percentage = parseInt( Theme_Colors.range, 10) / 100 || 0;
				if( model ){
					model.set({
						color : color.toHexString(),
						prev : model.get("color"),
						highlight : this.color_luminance( color.toHex(), percentage ),
						shade : this.color_luminance( color.toHex(), (percentage * -1) ),
						alpha : color.alpha
					});
					$(picker).parent().find(".sp-preview").css({
						backgroundColor : color.toRgbString(),
						backgroundImage : "none"
					});
					if( color.toHexString() === '#000000' && color.alpha == 0 ) {
						$(picker).parent().find(".sp-preview").addClass( 'uf-unset-color' );
						$(picker).parent().find(".sp-replacer").addClass("uf-unset-color-wrapper");
					}
					else {
						$(picker).parent().find(".sp-preview").removeClass( 'uf-unset-color' );
						$(picker).parent().find(".sp-replacer").removeClass("uf-unset-color-wrapper");
					}
					picker.default_value = color.toRgbString();
					this.render_bottom();
				}
			}
		});
	});
}(jQuery));
