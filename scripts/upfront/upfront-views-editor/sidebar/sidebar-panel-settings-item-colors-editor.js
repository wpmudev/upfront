(function($, Backbone){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        "scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-item",
        "scripts/upfront/upfront-views-editor/theme-colors",
        "text!upfront/templates/sidebar_settings_theme_colors.html"
    ], function ( SidebarPanel_Settings_Item, Theme_Colors, sidebar_settings_theme_colors_tpl ) {

        return SidebarPanel_Settings_Item.extend({
            initialize : function(){
                var self = this;
                this.template = _.template(sidebar_settings_theme_colors_tpl);
                //this.bottomTemplate = _.template( $(_Upfront_Templates.sidebar_settings_theme_colors).find(".panel-setting-theme-colors-bottom").html() );
                Upfront.Events.on("command:layout:save", this.on_save, this);
                Upfront.Events.on("command:layout:save_as", this.on_save, this);
                if (Upfront.Settings.Application.NO_SAVE) Upfront.Events.on("preview:build:start", this.on_save, this); // Also build colors on preview, only in anonymous mode
                this.update_styles();
                Theme_Colors.colors.bind('change reset add', this.update_styles, this);
            },
            events : {
                "change .panel-setting-theme-colors-shades-range": "change_range",
                "click .theme-colors-color-box" : "select_variation"
            },
            on_save : function(){
                var post_data = {
                    action: 'upfront_update_theme_colors',
                    theme_colors: Theme_Colors.colors.toJSON(),
                    range : Theme_Colors.range
                };

                Upfront.Util.post(post_data)
                    .error(function(){
                        return notifier.addMessage(l10n.theme_colors_save_fail);
                    });
                var styles_post_data = {
                    action: 'upfront_save_theme_colors_styles',
                    styles: this.styles
                };
                Upfront.Util.post(styles_post_data)
                    .error(function(){
                        return notifier.addMessage(l10n.theme_color_style_save_fail);
                    });

            },
            update_styles : function(){
                // Update the styles
                this.styles = "";
                var self = this;
                Theme_Colors.colors.each(function( item, index ){
                    var color = item.get("color") === '#000000' && item.get("alpha") == 0 ? 'inherit' : item.get("color");
                    self.styles += " .upfront_theme_color_" + index +"{ color: " + color + ";}";
                    self.styles += " a .upfront_theme_color_" + index +":hover{ color: " + item.get_hover_color() + ";}";
                    self.styles += " button .upfront_theme_color_" + index +":hover{ color: " + item.get_hover_color() + ";}";
                    self.styles += " .upfront_theme_bg_color_" + index +"{ background-color: " + color + ";}";
                    self.styles += " a .upfront_theme_bg_color_" + index +":hover{ background-color: " + item.get_hover_color() + ";}";
                    self.styles += " button .upfront_theme_bg_color_" + index +":hover{ background-color: " + item.get_hover_color() + ";}";
                    Upfront.Util.colors.update_colors_in_dom(item.get("prev"), color, index);
                });
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
                    empty_picker = new Field_Color({
                        className : 'upfront-field-wrap upfront-field-wrap-color sp-cf theme_color_swatch theme_color_swatch_empty',
                        hide_label : true,
                        default_value: '#ffffff',
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
                this.$(".theme_colors_empty_picker").html(empty_picker.$el)
                    .prepend('<span class="theme-colors-color-name">ufc' + index + '</span>');
            },
            add_unset_color : function(index){
                var self = this,
                    empty_picker = new Field_Color({
                        className : 'upfront-field-wrap upfront-field-wrap-color sp-cf theme_color_swatch',
                        hide_label : true,
                        default_value: 'rgba(0, 0, 0, 0)',
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

                empty_picker.$(".sp-preview").addClass("uf-unset-color");

                this.$('#theme-colors-swatches').append( empty_picker.$el );
                empty_picker.$el.wrap( '<span class="theme-colors-color-picker color-index">'.replace( "index", index) );
                empty_picker.$el.closest('.theme-colors-color-picker').prepend( '<span class="theme-colors-color-name">ufcindex</span>'.replace( "index", index) );

            },
            add_previous_pickers : function(){
                var self = this;
                this.$(".theme-colors-color-picker").each(function(index){
                    var picker = this,
                        $this = $(this),
                        color = $this.data("color"),
                        model = self.theme_colors.colors.at(index),
                        picker = new Field_Color({
                            className : 'upfront-field-wrap upfront-field-wrap-color sp-cf theme_color_swatch',
                            hide_label : true,
                            default_value: color,
                            blank_alpha: 0,
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
                    }
                    else {
                        picker.$(".sp-preview").removeClass( 'uf-unset-color' );
                    }
                    $this.html( picker.$el );
                    $this.prepend('<span class="theme-colors-color-name">ufc' + index + '</span>');
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
                    new_color_picker = new Field_Color({
                        className : 'upfront-field-wrap upfront-field-wrap-color sp-cf theme_color_swatch theme-colors-color-picker',
                        hide_label : true,
                        default_value: color.toRgbString(),
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
                }
                else {
                    new_color_picker.$(".sp-preview").removeClass( 'uf-unset-color' );
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
                this.$(".panel-setting-theme-colors-bottom").html(
                    this.bottomTemplate( {
                        colors : Theme_Colors.colors.toJSON(),
                        range  : Theme_Colors.range
                    } )
                );
                this.add_slider();
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
                    }
                    else {
                        $(picker).parent().find(".sp-preview").removeClass( 'uf-unset-color' );
                    }
                    picker.default_value = color.toRgbString();
                    this.render_bottom();
                }
            }
        });
    });
}(jQuery, Backbone));