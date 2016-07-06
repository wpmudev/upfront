(function($) {

    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;

    define([
        "text!upfront/templates/popup.html"
    ], function(popup_tpl) {


        var Variant_View = Backbone.View.extend({
            initialize: function(options){
                this.options = options || {};
            },
            className: function() {
                var className = 'font-variant-preview';
                if (this.model.get('already_added')) {
                    className += ' font-variant-already-added';
                }
                return className;
            },
            template: _.template('<span class="font-family">{{family}} — {{name}}</span>{[ if(already_added) { ]} <span class="already-added">' + l10n.already_added + '</span>{[ } ]}' +
                '{[ if(heading_preview) { ]}<h1 style="font-family: {{family}}; font-weight: {{weight}}; font-style: {{style}};" class="heading-font-preview font-preview">' + l10n.header_preview_quote + '</h1>{[ } else { ]}' +
                '<p style="font-family: {{family}}; font-weight: {{weight}}; font-style: {{style}};" class="paragraph-font-preview font-preview">' + l10n.body_preview_quote + '</p>{[ } ]}'),
            events: {
                'click': 'on_click'
            },
            render: function() {
                this.$el.html(this.template(_.extend({heading_preview: this.options.heading_preview}, this.model.toJSON())));
                return this;
            },
            on_click: function() {
                if (this.model.get('already_added')) return;
                this.model.set({selected: !this.model.get('selected')});
                this.$el.toggleClass('font-variant-selected');
            }
        });

        // THEME FONTS START HERE //
        var Font_Model = Backbone.Model.extend({}, {
            /*
             * Parsing variant to get style and weight for font.
             * @return Object { style: style, weight: weight }
             */
            parse_variant: function(variant) {
                var parsed_variant;
                // For system fonts there are variants in format "{number} {style}" where {number} is
                // 100-900 with step of 100, and {style} is "normal", "italic" or "oblique"
                //
                // Fog google fonts variants can be in format "regular", "italic", "100" to "900",
                // "100italic" to "900italic".
                //
                // From browser font-weight[s] we'll use: 100 to 900, normal.
                // From browser font-style we'll use: italic, normal, oblique.
                //
                // Regular variant means that both font-weight and font-style are normal or not set.
                // Always set both style and weight to make everything easier.
                // Always use numbers for weight to make everything easier.
                if (variant === 'inherit') {
                    return {
                        weight: 'inherit',
                        style: 'inherit'
                    };
                }

                // Cover both '100italic' and '100 italic'
                if (!_.isUndefined( variant ) && variant.match(/^(\d+) *(normal|italic|oblique)$/)) {
                    parsed_variant =  variant.match(/^(\d+) *(normal|italic|oblique)/);
                    return {
                        weight: parsed_variant[1],
                        style: parsed_variant[2]
                    };
                }

                if (variant === 'italic') {
                    return {
                        weight: '400',
                        style: 'italic'
                    };
                }

                // Cover 100, 200, 500 etc styles
                if ( !_.isUndefined( variant ) && variant.match(/^\d+$/)) {
                    return {
                        weight: variant,
                        style: 'normal'
                    };
                }

                // Default return value, also covers "regular" variant
                return {
                    weight: '400',
                    style: 'normal'
                };
            },
            /*
             * Constructs variant from weight and style.
             *
             * Variant should always be displayed as:
             * "{weight} {style}"
             * where weight is {number} from 100 to 900 step 100 and {style} is
             * "normal", "italic" or "oblique".
             * Unless:
             * 1. weight is 400(normal) and style is "normal" than variant is "regular".
             * 2. weight is 400(normal) and style is "italic" than variant is "italic",
             *
             * @return String variant
             */
            get_variant: function(weight, style) {
                if (weight === 'inherit' || style === 'inherit') {
                    return 'inherit';
                }

                weight = this.normalize_weight(weight);
                if (style === '') style = 'normal';

                if (weight === '400' && style === 'normal') return 'regular';
                if (weight === '400' && style === 'italic') return 'italic';

                return weight + ' ' + style;
            },
            /*
             * @see get_variant()
             */
            normalize_variant: function(variant) {
                var parsed_variant = this.parse_variant(variant);
                return this.get_variant(parsed_variant.weight, parsed_variant.style);
            },
            /*
             * Convert weight to number for comparison.
             */
            normalize_weight: function (weight) {
                if ( weight == 'normal' || weight == '' ) return 400;
                if ( weight == 'lighter' ) return 100; // either 100-300 depend to the available weight
                if ( weight == 'bold' ) return 700;
                if ( weight == 'bolder' ) return 900; // either 800-900 depend to the available weight
                return weight;
            },
            get_default_variant: function(family) {
                return 'inherit';
            }
        });

        var Fonts_Collection = Backbone.Collection.extend({
            model: Font_Model
        });

        /**
         * Takes care about Google fonts.
         */
        var Google_Fonts_Storage = function() {
            var fonts = false;

            /*
             * Returns deferred that resolves to fonts collection containing all Google fonts.
             */
            this.get_fonts = function() {
                if (fonts) return fonts;

                var request = Upfront.Util.post({action: "upfront_list_google_fonts"});

                // We're gonna pipe response since we need to convert it to fonts collection first.
                request = request.then(
                    function(response) {
                        fonts = new Fonts_Collection(response.data);
                        // Return collection instead original response
                        return fonts;
                    }
                );

                return request;
            };
        };

        var google_fonts_storage = new Google_Fonts_Storage();

        var System_Fonts_Storage = function() {
            var font_families = [
                { family: "Andale Mono", category:'monospace' },
                { family: "Arial", category:'sans-serif' },
                { family: "Arial Black", category:'sans-serif' },
                { family: "Courier New", category:'monospace' },
                { family: "Georgia", category:'serif' },
                { family: "Impact", category:'sans-serif' },
                { family: "Times New Roman", category:'serif' },
                { family: "Trebuchet MS", category:'sans-serif' },
                { family: "Verdana", category:'sans-serif' }
            ];

            var system_fonts = new Fonts_Collection();

            var initialize = function() {
                var variants;

                // Default variants for system fonts
                variants = ['Inherit', '400', '400 italic', '700', '700 italic'];

                // Add variants
                _.each(font_families, function(font_family) {
                    font_family.variants = variants;
                    system_fonts.add(font_family);
                });
            };

            this.get_fonts = function() {
                return system_fonts;
            };

            initialize();
        };

        var system_fonts_storage = new System_Fonts_Storage();

        var ThemeFontModel = Backbone.Model.extend({
            initialize: function(attributes) {
                this.set({ displayVariant: Font_Model.normalize_variant(attributes.variant) }, { silent: true });
            }
        });

        var ThemeFontsCollection = Backbone.Collection.extend({
            model: ThemeFontModel,
            get_fonts_for_select: function() {
                var typefaces_list = [{ label: l10n.choose_font, value:'' }],
                    google_fonts = [];


                _.each(theme_fonts_collection.models, function(theme_font) {
                    google_fonts.push(theme_font.get('font').family);
                });
                _.each(_.uniq(google_fonts), function(google_font) {
                    typefaces_list.push({label: google_font, value: google_font});
                });
                _.each(Upfront.mainData.additionalFonts, function(font) {
                    typefaces_list.push({label: font.family, value: font.family});
                });
                _.each(system_fonts_storage.get_fonts().models, function(font)	{
                    typefaces_list.push({ label: font.get('family'), value: font.get('family') });
                });

                return typefaces_list;
            },

            get_variants: function(font_family) {
                var variants;

                _.each(system_fonts_storage.get_fonts().models, function(font) {
                    if (font_family === font.get('family')) {
                        variants = font.get('variants');
                    }
                });
                if (variants) {
                    return variants;
                }

                _.each(Upfront.mainData.additionalFonts, function(font) {
                    if (font_family === font.family) {
                        variants = ['inherit'].concat(font.variants);
                    }
                });

                if (variants) {
                    return variants;
                }

                variants = [];
                _.each(theme_fonts_collection.models, function(theme_font) {
                    if (font_family === theme_font.get('font').family) {
                        variants.push(theme_font.get('displayVariant'));
                    }
                });

                variants.unshift('inherit');
                return variants;
            },

            get_variants_for_select: function(font_family) {
                var variants;
                var typefaces_list = [];

                _.each(system_fonts_storage.get_fonts().models, function(font) {
                    if (font_family === font.get('family')) {
                        _.each(font.get('variants'), function(font_style) {
                            typefaces_list.push({ label: font_style, value: font_style });
                        });
                    }
                });

                _.each(Upfront.mainData.additionalFonts, function(font) {
                    if (font_family === font.family) {
                        _.each(font.variants, function(font_style) {
                            typefaces_list.push({ label: font_style, value: font_style });
                        });
                    }
                });

                _.each(theme_fonts_collection.models, function(theme_font) {
                    if (font_family === theme_font.get('font').family) {
                        var font_style = theme_font.get('displayVariant');
                        typefaces_list.push({ label: font_style, value: font_style });
                    }
                });

                return typefaces_list;
            },


            get_additional_font: function(font_family) {
                var font = _.findWhere(Upfront.mainData.additionalFonts, {family: font_family});
                if (font) return new Backbone.Model(font);
                return;
            }
        });

        var theme_fonts_collection = new ThemeFontsCollection(Upfront.mainData.themeFonts);

        var IconFont = Backbone.Model.extend({
            getUploadStatus: function() {
                if (_.keys(this.get('files')).length === 4) {
                    return true;
                }
                var text = 'Please upload:';
                _.each(['eot', 'woff', 'svg', 'ttf'], function(type) {
                    if (_.isUndefined(this.get('files')[type])) {
                        text += ' ' + type + ',';
                    }
                }, this);
                return text.substring(0, text.length - 1) + ' file(s).';
            }
        });
        var IconFontCollection = Backbone.Collection.extend({
            model: IconFont
        });
        var icon_fonts_collection = new IconFontCollection(Upfront.mainData.iconFonts);

        var Theme_Fonts_Storage = function(stored_fonts) {
            var theme_fonts;

            var initialize = function() {
                // When more than one weights are added at once don't send bunch of server calls
                var save_theme_fonts_debounced = _.debounce(save_theme_fonts, 100);
                theme_fonts_collection.on('add remove', save_theme_fonts_debounced);
            };

            var save_theme_fonts = function() {
                var postData = {
                    action: 'upfront_update_theme_fonts',
                    theme_fonts: theme_fonts_collection.toJSON()
                };

                Upfront.Util.post(postData)
                    .error(function(){
                        return notifier.addMessage(l10n.theme_fonts_save_fail);
                    });
            };

            initialize();
        };

        var theme_fonts_storage = new Theme_Fonts_Storage();

        var ThemeFontListItem = Backbone.View.extend({
            className: 'theme-font-list-item',
            events: {
                'click': 'on_click',
                'click .delete': 'on_delete'
            },
            template: $(popup_tpl).find('#theme-font-list-item').html(),
            render: function() {
                this.$el.html(_.template(this.template, {
                    family: this.model.get('font').family,
                    variant: this.model.get('displayVariant')
                }));

                return this;
            },
            on_click: function() {
                this.$el.siblings().removeClass('theme-font-list-item-selected');
                this.$el.addClass('theme-font-list-item-selected');

                this.trigger('selected', this.model.toJSON());
            },
            on_delete: function() {
                theme_fonts_collection.remove(this.model);
                this.remove();
            }
        });

        var ThemeFontsPanel = Backbone.View.extend({
            className: 'theme-fonts-panel panel',
            template: _.template($(popup_tpl).find('#theme-fonts-panel').html()),
            initialize: function(options) {
                this.options = options || {};
                this.listenTo(this.collection, 'add remove', this.update_stats);
                this.listenTo(this.collection, 'add remove', this.render);
            },
            render: function() {
                this.$el.html('');
                this.$el.html(this.template({show_no_styles_notice: this.collection.length === 0}));

                if (this.collection.length > 0) this.$el.find('.font-list').css('background', 'white');

                _.each(this.collection.models, function(model) {
                    this.add_one(model);
                }, this);

                this.update_stats();

                return this;
            },
            update_stats: function() {
                var msg = l10n.font_styles_selected.replace(/%d/, this.collection.length);
                this.$el.find('.font-stats').html('<strong>' + msg + '</strong>');
            },
            add_one: function(model) {
                var themeFontView = new ThemeFontListItem({ model: model });
                this.options.parent_view.listenTo(themeFontView, 'selected', this.options.parent_view.replaceFont);
                this.$el.find('.font-list').append(themeFontView.render().el);
            }
        });

        var Font_Variants_Preview = Backbone.View.extend({
            id: 'font-variants-preview',
            initialize: function(options) {
                this.options = options || {};
            },
            addOne: function(model) {
                var variant_view = new Variant_View({model: model, heading_preview: this.options.heading_preview});
                this.$el.append(variant_view.render().el);
            },
            render: function() {
                _.each(this.collection.models, function(model) {
                    this.addOne(model);
                }, this);

                return this;
            },
            get_selected: function() {
                var selected = [];
                _.each(this.collection.models, function(model) {
                    if (model.get('selected')) selected.push(model.get('variant'));
                });
                return selected;
            }
        });

        var Icon_Fonts_Manager = Backbone.View.extend({
            id: 'icon-fonts-manager',
            className: 'clearfix',
            template: _.template($(popup_tpl).find('#icon-fonts-manager-tpl').html()),

            events: {
                'click .upload-icon-font': 'triggerFileChooser',
                'click .icon-font-upload-status': 'triggerFileChooser',
                'click .icon-fonts-list-item': 'makeFontActive'
            },

            triggerFileChooser: function() {
                this.$el.find('#upfront-icon-font-input').click();
            },

            render: function() {
                this.$el.html(this.template({
                    url: Upfront.mainData.ajax,
                    show_no_fonts_notice: false,
                    fonts: this.collection.models
                }));

                if (_.isUndefined(this.collection.findWhere({active: true}))) {
                    this.$el.find('[data-family="icomoon"]').addClass('icon-fonts-list-item-active');
                }

                if (!this.fileUploadInitialized) {
                    this.fileUploadInitialized = true;
                    this.initializeFileUpload();
                }

                return this;
            },

            initializeFileUpload: function() {
                if (!jQuery.fn.fileupload) return false; // No file upload, carry on

                var me = this;
                this.$el.find('#upfront-upload-icon-font').fileupload({
                    dataType: 'json',
                    done: function (e, data) {
                        var font = data.result.data.font;
                        var fontObject;

                        if (_.keys(font.files).length === 1) {
                            me.$el.find('.icon-fonts-list').append('<div data-family="' + font.family + '" class="icon-fonts-list-item">' + font.name + '</div>');
                            me.collection.add(font);
                        } else {
                            fontObject = me.collection.findWhere({'family': font.family});
                            fontObject.set({files: font.files});
                            if (fontObject.get('active') === true) {
                                me.updateActiveFontStyle(font.family);
                            }
                        }

                        fontObject = me.collection.findWhere({'family': font.family});
                        var listItem = me.$el.find('[data-family=' + font.family + ']');
                        listItem.find('.icon-font-upload-status').remove();
                        if (fontObject.getUploadStatus() !== true) {
                            listItem.append('<span class="icon-font-upload-status" title="' + fontObject.getUploadStatus() + '">*</span>');
                        }
                    }
                });
            },

            makeFontActive: function(event) {
                var fontItem = $(event.currentTarget);
                fontItem.siblings().removeClass('icon-fonts-list-item-active');
                fontItem.addClass('icon-fonts-list-item-active');

                var postData = {
                    action: 'upfront_update_active_icon_font',
                    family: fontItem.data('family')
                };


                Upfront.Util.post(postData)
                    .error(function(){
                        return notifier.addMessage('Could not update active icon font');
                    });

                $('#active-icon-font').remove();
                _.each(this.collection.models, function(model) {
                    model.set({'active': false});
                });

                if (fontItem.data('family') === 'icomoon') {
                    return; // this is default font, no need to add style for it
                }

                this.collection.findWhere({family: fontItem.data('family')}).set({active: true});
                this.updateActiveFontStyle(fontItem.data('family'));
            },

            updateActiveFontStyle: function(family) {
                var font = this.collection.findWhere({family: family});
                var longSrc = '';
                _.each(font.get('files'), function(file, type) {
                    longSrc += "url('" + Upfront.mainData.currentThemeUrl + '/icon-fonts/' + file + "') format('";
                    switch(type) {
                        case 'eot':
                            longSrc += 'embedded-opentype';
                            break;
                        case 'woff':
                            longSrc += 'woff';
                            break;
                        case 'ttf':
                            longSrc += 'truetype';
                            break;
                        case 'svg':
                            longSrc += 'svg';
                            break;
                    }
                    longSrc += "'),";
                });
                var icon_font_style = "@font-face {" +
                    "	font-family: '" + font.get('family') + "';";
                if (font.get('files').eot) {
                    icon_font_style += "src: url('" + Upfront.mainData.currentThemeUrl + '/icon-fonts/' + font.get('files').eot + "');";
                }
                icon_font_style += "	src:" + longSrc.substring(0, longSrc.length - 1) + ';';

                icon_font_style +=
                    "	font-weight: normal;" +
                    "	font-style: normal;" +
                    "}" +
                    ".uf_font_icon, .uf_font_icon * {" +
                    "	font-family: '" + font.get('family') + "'!important;" +
                    "}";

                $('body').append('<style id="active-icon-font">' + icon_font_style + '</style>');
            }
        });

        var Text_Fonts_Manager = Backbone.View.extend({
            id: 'text-fonts-manager',
            className: 'clearfix',
            template: _.template($(popup_tpl).find('#text-fonts-manager-tpl').html()),
            events: {
                'click .add-font-button': 'add_font',
                'click .preview-size-p': 'on_p_click',
                'click .preview-size-h1': 'on_h1_click'
            },
            initialize: function() {
                this.theme_fonts_panel = new ThemeFontsPanel({
                    collection: this.collection,
                    parent_view: this
                });
                this.listenTo(this.collection, 'remove', this.update_variants_on_remove);
            },
            render: function() {
                var me = this;

                this.$el.html(this.template({show_no_styles_notice: this.collection.length === 0}));
                $.when(google_fonts_storage.get_fonts()).done(function(fonts_collection) {
                    me.load_google_fonts(fonts_collection);
                });

                this.$el.find('.add-font-panel').after(this.theme_fonts_panel.render().el);
                if (!Upfront.mainData.userDoneFontsIntro) this.$el.addClass('no-styles');

                this.$el.find('.choose-font').after('<div class="preview-type"><span class="preview-type-title">' + Upfront.Settings.l10n.global.behaviors.preview_size + '</span><span class="preview-size-p selected-preview-size">P</span><span class="preview-size-h1">H1</span></div>');

                return this;
            },
            on_p_click: function() {
                this.$el.find('.preview-size-h1').removeClass('selected-preview-size');
                this.$el.find('.preview-size-p').addClass('selected-preview-size');
                this.heading_preview = false;
                this.update_variants();
            },
            on_h1_click: function() {
                this.$el.find('.preview-size-h1').addClass('selected-preview-size');
                this.$el.find('.preview-size-p').removeClass('selected-preview-size');
                this.heading_preview = true;
                this.update_variants();
            },
            add_font: function() {
                var variants;
                var font = google_fonts_storage.get_fonts().findWhere({ 'family': this.font_family_select.get_value() });
                if (_.isEmpty(font)) {
                    alert(l10n.choose_font_weight);
                    return;
                }

                variants = this.choose_variants.get_selected();
                if (_.isEmpty(variants)) {
                    alert(l10n.choose_one_font_weight);
                    return;
                }
                _.each(variants, function(variant) {
                    theme_fonts_collection.add({
                        id: font.get('family') + variant,
                        font: font.toJSON(),
                        variant: variant
                    });
                });
                this.update_variants();
            },
            load_google_fonts: function(fonts_collection) {
                var add_font_panel = this.$el.find('.add-font-panel');
                var typefaces_list = [{ label: l10n.click_to_pick_google_font, value: ''}];
                _.each(fonts_collection.pluck('family'), function(family) {
                    typefaces_list.push({ label: family, value: family });
                });
                add_font_panel.find('.loading-fonts').remove();
                // Select font
                this.font_family_select = new Field_Chosen_Select({
                    label: l10n.typeface,
                    values: typefaces_list,
                    placeholder: l10n.choose_font,
                    additional_classes: 'choose-font'
                });
                this.font_family_select.render();
                add_font_panel.find('.font-weights-list').before(this.font_family_select.el);
                $('.upfront-chosen-select', this.$el).chosen({
                    width: '289px'
                });
                this.listenTo(this.font_family_select, 'changed', this.update_variants);
            },
            update_variants_on_remove: function() {
                this.update_variants();
            },
            update_variants: function(model) {
                this.$el.find('.font-weights-list').css('background', 'white');
                if (!model) model = google_fonts_storage.get_fonts().findWhere({ 'family' : this.font_family_select.get_value() });
                if (!model) return;
                // Choose variants
                var variants = new Backbone.Collection();
                _.each(model.get('variants'), function(variant) {
                    // Add font to page so we can make preview with real fonts
                    if ($('#' + model.get('family').toLowerCase() + variant + '-css').length === 0) {
                        $('head').append('<link rel="stylesheet" id="' + model.get('family').toLowerCase() + '-' + variant + '-css" href="//fonts.googleapis.com/css?family=' + model.get('family') + '%3A' + variant + '" type="text/css" media="all">');
                    }
                    var weight_style = Font_Model.parse_variant(variant);
                    variants.add({
                        family: model.get('family'),
                        name: Font_Model.normalize_variant(variant),
                        variant: variant,
                        already_added: !!theme_fonts_collection.get(model.get('family') + variant),
                        weight: weight_style.weight,
                        style: weight_style.style
                    });
                });
                if (this.choose_variants) this.choose_variants.remove();

                this.choose_variants = new Font_Variants_Preview({
                    collection: variants,
                    heading_preview: this.heading_preview
                });
                this.choose_variants.render();
                this.$el.find('.font-weights-list-wrapper').html(this.choose_variants.el);
            },
            set_ok_button: function(button) {
                button.on('click', this.on_ok_click);
            },
            on_ok_click: function(event) {
                Upfront.Events.trigger("upfront:render_typography_sidebar");

                if (Upfront.mainData.userDoneFontsIntro) return;

                Upfront.Util.post({action: "upfront_user_done_font_intro"});
                Upfront.mainData.userDoneFontsIntro = true;
            }
        });

        var Insert_Font_Widget = Backbone.View.extend({
            initialize: function() {
                var me = this;
                this.fields = [
                    new Field_Typeface_Chosen_Select({
                        label: '',
                        compact: true,
                        values: theme_fonts_collection.get_fonts_for_select(),
                        additional_classes: 'choose-typeface',
                        select_width: '230px'
                    }),
                    new Field_Typeface_Style_Chosen_Select({
                        label: '',
                        compact: true,
                        values: [],
                        additional_classes: 'choose-variant',
                        select_width: '120px'
                    }),
                    new Field_Button({
                        label: l10n.insert_font,
                        compact: true,
                        on_click: function(){
                            me.finish();
                        }
                    })
                ];
            },
            render: function() {
                $('#insert-font-widget').html('').addClass('open');
                this.$el.html('');
                _.each(this.fields, function(field) {
                    field.render();
                    this.$el.append(field.el);
                }, this);

                this.listenTo(this.fields[0], 'changed', function() {
                    var variants = theme_fonts_collection.get_variants(this.fields[0].get_value());
                    this.render_variants(variants);
                });
                this.listenTo(this.fields[1], 'changed', function() {
                    this.preview_font();
                });

                $('.choose-typeface select', this.$el).chosen({
                    width: '230px',
                    disable_search: true
                });
                $('.choose-variant select', this.$el).chosen({
                    width: '120px',
                    disable_search: true
                });

                return this;
            },
            render_variants: function(variants) {
                var $variant_field = this.$el.find('.choose-variant select');
                $variant_field.find('option').remove();
                $variant_field.append('<option value="">' + l10n.choose_variant + '</option>');
                _.each(variants, function(variant) {
                    $variant_field.append('<option value="' + variant + '">' + variant + '</option>');
                });
                $variant_field.trigger('chosen:updated');
            },
            preview_font: function() {
                this.replaceFont({
                    font_family: this.fields[0].get_value(),
                    variant: Font_Model.parse_variant(this.fields[1].get_value())
                });
            },
            replaceFont: function(font) {
                var lines;
                this.editor = Upfront.Application.cssEditor.editor;
                this.style_doc = this.editor.getSession().getDocument();

                this.last_selected_font = font;

                // Insert selected font family
                if (!this.font_family_range) {
                    this.font_family_range = this.editor.getSelection().getRange();
                } else {
                    this.font_family_range.end = this.end_point;
                }
                this.end_point = this.style_doc.replace(this.font_family_range, font.font_family);

                // Insert selected weight and style, first reset them
                this.reset_properties();
                lines = [];
                if (font.variant.weight) {
                    lines.push('    font-weight: ' + font.variant.weight + ';');
                }
                if (font.variant.style) {
                    lines.push('    font-style: ' + font.variant.style + ';');
                }
                if (lines.length > 0) {
                    this.style_doc.insertLines(this.font_family_range.start.row + 1, lines);
                }
            },
            reset_properties: function() {
                var row, line, result;
                this.editor = Upfront.Application.cssEditor.editor;
                this.style_doc = this.editor.getSession().getDocument();
                // Search forward only from font family row since lower properties override upper
                result = {};
                row = this.font_family_range.start.row + 1;
                line = this.style_doc.getLine(row);
                while (line.indexOf('}') < 0) {
                    if (line.indexOf('font-weight') !== -1) {
                        result.weight = row;
                        if (!this.starting_weight) this.starting_weight = line;
                    }
                    if (line.indexOf('font-style') !== -1) {
                        result.style = row;
                        if (!this.starting_style) this.starting_style = line;
                    }

                    row++;
                    line = this.style_doc.getLine(row);
                    if (!line) {
                        // Fix missing closing paren
                        //this.style_doc.insertLines(row, ['}']); // This adds a standalone new brace for some reason
                        break;
                    }
                }

                // Reset properties. This is complicated. If both font style and font weight properties are in current style rule
                // we need to remove them carefully because when we remove first, seconds' row number might change
                // so first remove one with higher row number.
                if (result.weight && result.style) {
                    if (result.weight > result.style) {
                        this.style_doc.removeLines(result.weight, result.weight);
                        this.style_doc.removeLines(result.style, result.style);
                    } else {
                        this.style_doc.removeLines(result.style, result.style);
                        this.style_doc.removeLines(result.weight, result.weight);
                    }
                    result.weight = false;
                    result.style = false;
                }
                if (result.weight) {
                    this.style_doc.removeLines(result.weight, result.weight);
                }
                if (result.style) {
                    this.style_doc.removeLines(result.style, result.style);
                }
            },
            finish: function() {
                $('#insert-font-widget').html('<a class="upfront-css-font" href="#">' + l10n.insert_font + '</a>').removeClass('open');
            }
        });

        return {
            "System": system_fonts_storage,
            "Google": google_fonts_storage,
            Text_Fonts_Manager: Text_Fonts_Manager,
            Icon_Fonts_Manager: Icon_Fonts_Manager,
            theme_fonts_collection: theme_fonts_collection,
            icon_fonts_collection: icon_fonts_collection,
            Insert_Font_Widget: Insert_Font_Widget,
            Model: Font_Model
        };
    });
})(jQuery);