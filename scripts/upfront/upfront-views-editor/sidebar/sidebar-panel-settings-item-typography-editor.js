(function($, Backbone){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-item'
    ], function (SidebarPanel_Settings_Item) {
        return SidebarPanel_Settings_Item.extend({
            fields: {},
            current_element: 'h1',
            elements: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "a:hover", "ul", "ol", "blockquote", 'blockquote.upfront-quote-alternative'],
            inline_elements: ["a", "a:hover"],
            typefaces: {},
            styles: {},
            sizes: {},
            colors: {},
            line_heights: {},
            initialize: function () {
                var me = this;
                SidebarPanel_Settings_Item.prototype.initialize.call(this);
                var fonts = Fonts.Google.get_fonts();
                if (fonts && fonts.state) { // Is this a promise object? If not, DON'T try to re-render when it's "done", because we already have fonts
                    $.when(fonts).done(function() {
                        me.render();
                    });
                }
                this.listenTo(Upfront.Events, 'upfront:render_typography_sidebar', this.render);
                this.listenTo(Upfront.Events, 'entity:object:after_render', this.update_typography_elements);
                this.listenTo(Upfront.Events, "theme_colors:update", this.update_typography_elements, this);
            },
            on_render: function () {
                var me = this,
                    styles_list = [], // this will change with every font family change
                    $wrap_left = $('<div class="upfront-typography-fields-left" />'),
                    $wrap_right = $('<div class="upfront-typography-fields-right" />'),
                    typography = this.model.get_property_value_by_name('typography'),
                    layout_typography = _.findWhere(
                        Upfront.Application.current_subapplication.get_layout_data().properties,
                        { 'name': 'typography' }
                    ),
                    default_typography = {}; //$.parseJSON('{\"h1\":{\"weight\":\"100\",\"style\":\"normal\",\"size\":\"72\",\"line_height\":\"1\",\"font_face\":\"Arial\",\"font_family\":\"sans-serif\",\"color\":\"rgba(0,0,0,1)\"},\"h2\":{\"weight\":\"400\",\"style\":\"normal\",\"size\":\"50\",\"line_height\":\"1\",\"font_face\":\"Georgia\",\"font_family\":\"serif\"},\"h3\":{\"weight\":\"400\",\"style\":\"normal\",\"size\":\"36\",\"line_height\":\"1.3\",\"font_face\":\"Georgia\",\"font_family\":\"serif\"},\"h4\":{\"weight\":\"400\",\"style\":\"normal\",\"size\":\"30\",\"line_height\":\"1.2\",\"font_face\":\"Arial\",\"font_family\":\"sans-serif\"},\"h5\":{\"weight\":\"400\",\"style\":\"normal\",\"size\":\"25\",\"line_height\":\"1.2\",\"font_face\":\"Georgia\",\"font_family\":\"serif\"},\"h6\":{\"weight\":\"400\",\"style\":\"italic\",\"size\":\"22\",\"line_height\":\"1.3\",\"font_face\":\"Georgia\",\"font_family\":\"serif\"},\"p\":{\"weight\":\"400\",\"style\":\"normal\",\"size\":\"18\",\"line_height\":\"1.4\",\"font_face\":\"Georgia\",\"font_family\":\"serif\"},\"a\":{\"weight\":\"400\",\"style\":\"italic\",\"size\":false,\"line_height\":false,\"font_face\":\"Georgia\",\"font_family\":\"serif\",\"color\":\"rgba(0,206,141,1)\"},\"a:hover\":{\"weight\":\"400\",\"style\":\"italic\",\"size\":false,\"line_height\":false,\"font_face\":\"Georgia\",\"font_family\":\"serif\",\"color\":\"rgba(0,165,113,1)\"},\"ul\":{\"weight\":\"400\",\"style\":\"normal\",\"size\":\"16\",\"line_height\":\"1.5\",\"font_face\":\"Arial\",\"font_family\":\"sans-serif\",\"color\":\"rgba(0,0,0,1)\"},\"ol\":{\"weight\":\"400\",\"style\":\"normal\",\"size\":\"16\",\"line_height\":\"1.5\",\"font_face\":\"Arial\",\"font_family\":\"sans-serif\"},\"blockquote\":{\"weight\":\"400\",\"style\":\"italic\",\"size\":\"20\",\"line_height\":\"1.5\",\"font_face\":\"Georgia\",\"font_family\":\"serif\",\"color\":\"rgba(103,103,103,1)\"},\"blockquote.upfront-quote-alternative\":{\"weight\":\"400\",\"style\":\"italic\",\"size\":\"20\",\"line_height\":\"1.5\",\"font_face\":\"Georgia\",\"font_family\":\"serif\",\"color\":\"rgba(103,103,103,1)\"}}');

                layout_typography = layout_typography ? layout_typography.value : default_typography;
                var big_tablet_breakpoint,
                    tablet_breakpoint,
                    switcheroo;

                // Breakpoint's typography should initialize like this:
                // - if there is no typography for current breakpoint it should inherit settings from
                //   wider one, if wider one is not defined inherit from one above, last one is default
                //   typography
                // - in case of widest (usually tablet for now, big-tablet in some themes) it should
                //   inherit from default typography
                if (_.isEmpty(typography)) {
                    if (_.contains(['tablet', 'mobile'], this.model.get('id')) || this.model.get('name') === 'big-tablet') {
                        switcheroo = this.model.get('name') === 'big-tablet' ? 'big-tablet' : this.model.get('id');

                        switch (switcheroo) {
                            case 'big-tablet':
                                // We look into the default typography and get those
                                typography = _.clone(layout_typography);
                                break;
                            case 'tablet':
                                // We look to big-tablet typography, if it's undefined we take default typography
                                big_tablet_breakpoint = breakpoints_storage.get_breakpoints().findWhere({name:'big-tablet'});
                                if (_.isUndefined(big_tablet_breakpoint) || _.isUndefined(big_tablet_breakpoint.get('typography')) || _.isUndefined(big_tablet_breakpoint.get('typography').h2)) {
                                    typography = layout_typography;
                                } else {
                                    typography = _.clone(big_tablet_breakpoint.get('typography'));
                                }
                                break;
                            case 'mobile':
                                // We look to tablet typography, if it's undefined we take default typography
                                tablet_breakpoint = breakpoints_storage.get_breakpoints().findWhere({id:'tablet'});
                                if (_.isUndefined(tablet_breakpoint) || _.isUndefined(tablet_breakpoint.get('typography')) || _.isUndefined(tablet_breakpoint.get('typography').h2)) {
                                    typography = _.clone(layout_typography);
                                } else {
                                    typography = _.clone(tablet_breakpoint.get('typography'));
                                }
                        }
                    } else {
                        // ensures that when theme is created there will be reasonable values for typography
                        typography = layout_typography || default_typography;
                    }
                }

                this.typography = typography;

                //Pass global typography settings to typography module
                Upfront.mainData.global_typography = typography;

                // Check for theme fonts if no theme fonts just return string
                var currentMode = Upfront.Application.get_current();
                var builderMode = Upfront.Settings.Application.MODE.THEME;
                var doneIntro = Upfront.mainData.userDoneFontsIntro;
                var showChooseFontsButton = (currentMode === builderMode && !doneIntro) ||
                    (currentMode !== builderMode && Fonts.theme_fonts_collection.length === 0 && !doneIntro);

                var chooseButton;
                if (showChooseFontsButton) {
                    chooseButton = new Field_Button({
                        label: l10n.select_fonts_to_use,
                        compact: true,
                        classname: 'open-theme-fonts-manager',

                        on_click: function(e){
                            Upfront.Events.trigger('command:themefontsmanager:open');
                        }
                    });
                } else {
                    chooseButton = new Command_OpenFontManager();
                }

                if (Fonts.theme_fonts_collection.length === 0 && Upfront.mainData.userDoneFontsIntro === false) {
                    this.$el.html('<p class="sidebar-info-notice upfront-icon">' + l10n.no_defined_fonts + '</p>');
                    chooseButton.render();
                    this.$el.append(chooseButton.el);
                    return;
                }

                // Load saved styles for all elements
                _.each(typography, function (value, element) {
                    me.typefaces[element] = value.font_face;
                    me.colors[element] = value.color;

                    me.styles[element] = Fonts.Model.get_variant(value.weight, value.style);

                    if ( value.size )
                        me.sizes[element] = value.size;
                    if ( value.line_height )
                        me.line_heights[element] = value.line_height;
                });

                if ( !this.fields.length ) {
                    this.fields = {
                        start_font_manager: chooseButton,
                        element: new Upfront.Views.Editor.Field.Select({
                            label: l10n.type_element,
                            default_value: 'h1',
                            values: [
                                { label: l10n.h1, value: "h1" },
                                { label: l10n.h2, value: "h2" },
                                { label: l10n.h3, value: "h3" },
                                { label: l10n.h4, value: "h4" },
                                { label: l10n.h5, value: "h5" },
                                { label: l10n.h6, value: "h6" },
                                { label: l10n.p, value: "p" },
                                { label: l10n.a, value: "a" },
                                { label: l10n.ahover, value: "a:hover" },
                                { label: l10n.ul, value: "ul" },
                                { label: l10n.ol, value: "ol" },
                                { label: l10n.bq, value: "blockquote" },
                                { label: l10n.bqalt, value: "blockquote.upfront-quote-alternative" }
                            ],
                            change: function () {
                                var value = this.get_value(),
                                    is_inline = _.contains(me.inline_elements, value);
                                me.current_element = value;
                                me.fields.typeface.set_value( me.typefaces[value] );
                                me.update_styles_field();
                                if ( is_inline ){
                                    $([me.fields.size.el, me.fields.line_height.el]).hide();
                                } else {
                                    $([me.fields.size.el, me.fields.line_height.el]).show();
                                    me.fields.size.set_value( me.sizes[value] );
                                    me.fields.line_height.set_value( me.line_heights[value] || '1.1' );
                                }
                                me.fields.color.set_value( me.colors[value] );
                                me.fields.color.update_input_border_color(me.colors[value]);
                            }
                        }),
                        typeface: new Field_Typeface_Chosen_Select({
                            label: l10n.typeface,
                            values: Fonts.theme_fonts_collection.get_fonts_for_select(),
                            default_value: me.typefaces['h1'],
                            select_width: '225px',
                            change: function () {
                                var value = this.get_value(),
                                    element = me.current_element;
                                if ( me.typefaces[element] != value ){
                                    me.typefaces[element] = value;
                                    me.styles[element] = Fonts.Model.get_default_variant(value);
                                    me.update_typography();
                                    me.update_styles_field();
                                }
                            }
                        }),
                        style: this.get_styles_field(),
                        color: new Upfront.Views.Editor.Field.Color({
                            label: l10n.color,
                            default_value: me.colors['h1'],
                            autoHide: false,
                            spectrum: {
                                choose: function (color) {
                                    var rgb = color.toRgb(),
                                        rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')',
                                        element = me.current_element;
                                    rgba_string = color.get_is_theme_color() !== false ? color.theme_color: rgba_string;
                                    if ( me.colors[element] != rgba_string ){
                                        me.colors[element] = rgba_string;
                                        me.update_typography(color);
                                    }
                                }
                            }
                        }),
                        size: new Upfront.Views.Editor.Field.Number({
                            label: l10n.size,
                            min: 0,
                            max: 100,
                            suffix: l10n.px,
                            default_value: me.sizes['h1'],
                            change: function () {
                                var value = this.get_value(),
                                    element = me.current_element;
                                if ( me.sizes[element] != value ){
                                    me.sizes[element] = value;
                                    me.update_typography();
                                }
                            }
                        }),
                        line_height: new Upfront.Views.Editor.Field.Number({
                            label: l10n.line_height,
                            min: 0,
                            max: 10,
                            step: 0.1,
                            default_value: me.line_heights['h1'],
                            change: function () {
                                var value = this.get_value(),
                                    element = me.current_element;
                                if ( me.line_heights[element] != value ){
                                    me.line_heights[element] = value;
                                    me.update_typography();
                                }
                            }
                        })
                    };
                }
                this.$el.html('');
                this.$el.addClass('typography-panel');
                _.each( this.fields, function(field){
                    field.render();
                    field.delegateEvents();
                });
                this.$el.append([this.fields.start_font_manager.el, this.fields.element.el, this.fields.typeface.el]);
                $('.upfront-chosen-select', this.$el).chosen({
                    width: '230px'
                });
                $wrap_left.append([this.fields.style.el, this.fields.size.el]);
                this.$el.append($wrap_left);
                $wrap_right.append([this.fields.color.el, this.fields.line_height.el]);
                this.$el.append($wrap_right);
                this.update_typography(undefined, true);
            },
            /*
             * Style field needs some special treatment since options are completely changed
             * on every element dropdown or typeface dropdown value change.
             */
            update_styles_field: function() {
                this.fields.style.remove();
                this.fields.style = this.get_styles_field(this.typefaces[this.current_element]);
                this.fields.style.render();
                this.fields.style.delegateEvents();
                $('.upfront-typography-fields-left').prepend(this.fields.style.el);
            },
            get_styles_field: function(typeface) {
                var me = this;
                return new Field_Typeface_Style_Chosen_Select({
                    label: l10n.weight_style,
                    values: this.get_styles(),
                    default_value: me.get_styles_field_default_value(),
                    font_family: typeface,
                    select_width: '120px',
                    change: function () {
                        var value = this.get_value(),
                            element = me.current_element;
                        if ( me.styles[element] != value ){
                            me.styles[element] = value;
                            me.update_typography();
                        }
                    },
                    show: function (value) {
                        me.fields.style.set_option_font(value);
                    }
                });
            },
            get_styles_field_default_value: function() {
                var availableStyles = this.get_styles(),
                    elementTypeface = this.typefaces[this.current_element],
                    elementStyle = this.styles[this.current_element],
                    style;

                if (elementStyle) {
                    style = elementStyle;
                } else if (elementTypeface) {
                    style = Fonts.Model.get_default_variant(elementTypeface);
                } else {
                    style = 'regular';
                }

                // Make sure style is in available styles, this is needed because:
                // - regular is also noted as "400 normal" in system fonts
                // - italic is also noted as "400 italic" in system fonts
                if (style === 'regular' && !_.findWhere(availableStyles, { value: 'regular'}) && _.findWhere(availableStyles, { value: '400 normal'})) {
                    style = '400 normal';
                } else if (style === '400 normal' && !_.findWhere(availableStyles, { value: '400 normal'}) && _.findWhere(availableStyles, { value: 'regular'})) {
                    style = 'regular';
                }
                if (style === 'italic' && !_.findWhere(availableStyles, { value: 'italic'}) && _.findWhere(availableStyles, { value: '400 italic'})) {
                    style = '400 italic';
                } else if (style === '400 italic' && !_.findWhere(availableStyles, { value: '400 italic'}) && _.findWhere(availableStyles, { value: 'italic'})) {
                    style = 'italic';
                }

                return style;
            },
            get_styles: function() {
                var typography = this.typography,
                    element = this.current_element,
                    styles = [],
                    variants;

                if (false === typography) typography = {};

                if (_.isUndefined(typography[element]) || _.isUndefined(typography[element].font_face)) typography[element] = { font_face: 'Arial' };

                variants = Fonts.theme_fonts_collection.get_variants(typography[element].font_face);
                styles = [];
                _.each(variants, function(variant) {
                    styles.push({ label: variant, value: variant });
                });
                return styles;
            },
            update_typography: function (color, updateSilently) {
                var me = this,
                    css = [],
                    breakpointCss = [],
                    options = {};

                _.each(this.elements, function(element) {
                    var rules = [],
                        url,
                        is_inline = _.contains(me.inline_elements, element),
                        typeface = me.typefaces[element],
                        font_rule_value = false,
                        style = false,
                        weight = false,
                        selector = false,
                        $this_el = $('.upfront-object-content ' + element ),
                        font_family,
                        style_base,
                        theme_color_class;

                    style_base = Fonts.Model.parse_variant(me.styles[element] || 'regular');
                    weight = style_base.weight;
                    style = style_base.style;

                    if (typeface === '') {
                        font_family = Fonts.System.get_fonts().models[0];// default to first system font
                    }
                    // Try to get font family from system fonts.
                    if (_.isUndefined(font_family)) {
                        font_family = Fonts.System.get_fonts().findWhere({family: typeface});
                    }
                    // Try to get font family from additional fonts
                    if (_.isUndefined(font_family)) {
                        font_family = Fonts.theme_fonts_collection.get_additional_font(typeface);
                    }
                    if (_.isUndefined(font_family)) {
                        // This is a Google font
                        var ggfonts = Fonts.Google.get_fonts();
                        if (ggfonts && ggfonts.findWhere) {
                            font_family = ggfonts.findWhere({family: typeface});
                        }
                        if (!font_family) return true; // Missing typeface family, pretend we're normal
                        // If so, let's do this - load up the font
                        url = '//fonts.googleapis.com/css?family=' + font_family.get('family').replace(/ /g, '+');
                        if (400 !== parseInt("" + weight, 10) && 'inherit' !== weight) url += ':' + weight; // If not default weight, DO include the info
                        $("head").append('<link href="' + url + '" rel="stylesheet" type="text/css" />');
                    }

                    font_rule_value = '"' + font_family.get('family') + '",' + font_family.get('category');

                    // Don't include "inherit", as that's the default
                    if ('inherit' !== font_rule_value) {
                        rules.push('font-family: ' + font_rule_value);
                    }
                    if ('inherit' !== weight) {
                        rules.push('font-weight: ' + weight);
                    }
                    if ('inherit' !== style) {
                        rules.push('font-style: ' + style);
                    }

                    if ( !is_inline ){
                        rules.push('font-size: ' + me.sizes[element] + 'px');
                        rules.push('line-height: ' + me.line_heights[element] + 'em');
                    }

                    if( !_.isEmpty(me.colors[element]) && Upfront.Views.Theme_Colors.colors.is_theme_color( me.colors[element] ) ){
                        theme_color_class = Upfront.Views.Theme_Colors.colors.get_css_class( me.colors[element]);
                    } else {
                        rules.push('color: ' + me.colors[element]);
                    }
                    if ('blockquote' === element) {
                        selector = '.upfront-object-content blockquote, .upfront-object-content blockquote p';
                    } else if ('a' === element) {
                        selector = '.upfront-object-content a, .upfront-object-content a:link, .upfront-object-content a:visited';
                    } else if (
                        'h1' === element ||
                        'h2' === element ||
                        'h3' === element ||
                        'h4' === element ||
                        'h5' === element ||
                        'h6' === element
                    ) {
                        selector = '.upfront-object-content ' + element  + ', .upfront-object-content ' + element  + ' a, .upfront-ui ' + element + '.tag-list-tag';
                    } else {
                        selector = '.upfront-object-content ' + element  + ', .upfront-ui ' + element + '.tag-list-tag';
                    }
                    css.push(selector + '{ ' + rules.join("; ") + '; }');

                    if (_.contains(['tablet', 'mobile'], me.model.get('id'))) {
                        breakpointCss.push(  selector.replace(/\.upfront-object-content/g, '.' + me.model.get('id') + '-breakpoint .upfront-object-content')  + ' { ' + rules.join("; ") + '; }');
                    }

                    options[element] = {
                        weight: weight,
                        style: style,
                        size: !is_inline ? me.sizes[element] : false,
                        line_height: !is_inline ? (me.line_heights[element] || '1.1') : false,
                        font_face: font_family.get('family'),
                        font_family: font_family.get('category'), //todo this font_family is inconsistent. It should be called font_category
                        color: me.colors[element],
                        theme_color_class : theme_color_class
                    };
                });
                this.update_typography_elements();
                // Update silently when update_typography is called from on_render, otherwise
                // though tablet/mobile breakpoints do not have typography defined it will be
                // written to theme/db with defaults. This happens because for typography sidebar
                // to show something we have to load defaults (which is explained in initialize method),
                // so even if breakpoint does not have anything defined we have to load defaults from
                // next wider breakpoint to show what gets applied to current breakpoint.
                if (!updateSilently) {
                    this.model.set_property('typography', options);
                    this.typography = options;
                }
                if (_.contains(['tablet', 'mobile'], this.model.get('id'))) {
                    var styleId = this.model.get('id') + '-breakpoint-typography';
                    var cssText = breakpointCss.join("\n");

                    if ( $('#' + styleId).length ) {
                        $('#' + styleId).html(cssText);
                    } else {
                        $('body').find('style').first().before('<style id="' + styleId + '">' + cssText + '</style>');
                    }
                } else {
                    if ( $('head').find('#upfront-default-typography-inline').length ) {
                        $('head').find('#upfront-default-typography-inline').html( css.join("\n") );
                    } else {
                        $('<style id="upfront-default-typography-inline">' +css.join("\n") + '</style>').insertAfter($('head').find('link[rel="stylesheet"]').first());
                    }
                }
            },
            update_typography_elements: function (view) {
                var me = this;
                var css = [],
                    $style = false
                    ;
                $style = $("style#typography-colors");
                if (!$style.length) {
                    $("body").append('<style id="typography-colors" />');
                    $style = $("style#typography-colors");
                }
                _.each(this.elements, function (element) {
                    if (me.colors[element]) {
                        css.push('.upfront-object-content ' + element + '{ color:' + Upfront.Util.colors.to_color_value(me.colors[element]) + '; }');
                    }
                });
                $style.empty().append(css.join("\n"));
            }
        });
    });
}(jQuery, Backbone));