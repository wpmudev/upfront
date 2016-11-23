(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        "text!upfront/templates/popup.html",
        'scripts/upfront/upfront-views-editor/theme-colors',
        'scripts/upfront/upfront-views-editor/fonts',
				'scripts/perfect-scrollbar/perfect-scrollbar'
    ], function (popup_tpl, Theme_Colors, Fonts, perfectScrollbar) {
        /**
         * Like css editor but does not do saving and managing of styles.
         * Takes initial css from models "styles" property and fires change
         * event with new css.
         */
        return Backbone.View.extend({
            className: 'upfront-ui',
            id: 'upfront-general-csseditor',
            tpl: _.template($(popup_tpl).find('#csseditor-tpl').html()),
            prepareAce: false,
            ace: false,
            events: {
                'click .upfront-css-save-ok': 'fire_save',
                'click .upfront-css-close': 'close',
                'click .upfront-css-font': 'startInsertFontWidget',
                'click .upfront-css-image': 'openImagePicker',
                'click .upfront-css-selector': 'addSelector'
            },
            initialize: function(options) {
                var me = this,
                    deferred = $.Deferred(),
                    style_selector,
                    $style;

                this.options = options || {};
                this.model = options.model;
                this.sidebar = options.sidebar !== false;
                this.global = options.global === true;
                this.toolbar = ( options.toolbar !== false );
                this.prepareAce = deferred.promise();
                require([Upfront.Settings.ace_url], function(){
                    deferred.resolve();
                });

                this.resizeHandler = this.resizeHandler || function(){
                        me.$el.width($(window).width() - $('#sidebar-ui').width() -1);
                    };

                $(window).on('resize', this.resizeHandler);

                style_selector = this.model.get('id') + '-breakpoint-style';
                $style = $('#' + style_selector);
                if ($style.length === 0) {
                    this.$style = $('<style id="' + style_selector + '"></style>');
                    $('body').append(this.$style);
                } else {
                    this.$style = $style;
                }

                if (options.cssSelectors) {
                    this.selectors = options.cssSelectors;
                }


                if ( typeof options.change == 'function' ) this.listenTo(this, 'change', options.change);
                if ( typeof options.onClose == 'function' ) this.listenTo(this, 'close', options.onClose);

                this.render();

                this.startResizable();
            },
            close: function(event) {
                if(event)
                    event.preventDefault();

                $(window).off('resize', this.resizeHandler);

                if(this.editor)
                    this.editor.destroy();

                $('#page').css('padding-bottom', 0);
                this.remove();
            },
            render: function() {
                var me = this;

                $('#page').append(this.$el);

                if (!this.sidebar)
                    this.$el.addClass('upfront-css-no-sidebar');
                else
                    this.$el.removeClass('upfront-css-no-sidebar');

                this.$el.html(this.tpl({
                    selectors: this.selectors,
                    elementType: false,
                    show_style_name: false,
                    showToolbar: this.toolbar
                }));

                this.resizeHandler('.');

                var bodyHeight = this.$el.height() - this.$('.upfront-css-top').outerHeight();
                this.$('.upfront-css-body').height(bodyHeight);

                this.prepareAce.done(function(){
                    me.startAce();
                });

                this.prepareSpectrum();

                this.$el.show();
            },
            startAce: function() {
                var me = this,
                    editor = ace.edit(this.$('.upfront-css-ace')[0]),
                    session = editor.getSession()
                    ;

                session.setUseWorker(false);
                editor.setShowPrintMargin(false);

                session.setMode("ace/mode/css");
                editor.setTheme('ace/theme/monokai');

                editor.on('change', function(event){
                    var styles_with_selector;
                    var rules = editor.getValue().split('}'),
                        separator = '\n\n.' + me.options.page_class + ' ';

                    rules = _.map(rules, function(rule){return $.trim(rule);});
                    rules.pop();

                    styles_with_selector = rules.length ?  separator + rules.join('\n}' + separator) + '\n}' : "";

                    me.$style.html(styles_with_selector);
                    me.trigger('change', styles_with_selector);
                });

                var scope = new RegExp('\.' + this.options.page_class + '\s*', 'g'),
                    styles = this.model.get('styles') ? this.model.get('styles').replace(scope, '') : ''
                ;

                if (this.options.type === 'GalleryLightbox') {
                    styles = this.model.get('properties').get('styles').get('value').replace(scope, '');
                } else {
                    styles = this.model.get('styles') ?  this.model.get('styles').replace(scope, '') : "";
                }
                editor.setValue($.trim(styles), -1);

                // Set up the proper vscroller width to go along with new change.
                editor.renderer.scrollBar.width = 5;
                editor.renderer.scroller.style.right = "5px";

								// Add JS Scrollbar.
								perfectScrollbar.initialize(this.$el.find('.ace_scrollbar')[0], {
									suppressScrollX: true
								});

                editor.focus();
                this.editor = editor;
            },
            prepareSpectrum: function() {
                var me = this;

                me.$('.upfront-css-color').spectrum({
                    showAlpha: true,
                    showPalette: true,
                    palette: Theme_Colors.colors.pluck("color").length ? Theme_Colors.colors.pluck("color") : ['fff', '000', '0f0'],
                    maxSelectionSize: 9,
                    localStorageKey: "spectrum.recent_bgs",
                    preferredFormat: "hex",
                    chooseText: l10n.ok,
                    showInput: true,
                    allowEmpty:true,
                    show: function(){
                        spectrum = $('.sp-container:visible');
                    },
                    change: function(color) {
                        var colorString = color.alpha < 1 ? color.toRgbString() : color.toHexString();
                        me.editor.insert(colorString);
                        me.editor.focus();
                    },
                    move: function(color) {
                        var rgba = color.toRgbString();
                        spectrum.find('.sp-dragger').css('border-top-color', rgba);
                        spectrum.parent().find('.sp-dragger').css('border-right-color', rgba);
                    }
                });
            },
            startResizable: function() {
                // Save the fetching inside the resize
                var me = this,
                    $cssbody = me.$('.upfront-css-body'),
                    topHeight = me.$('.upfront-css-top').outerHeight(),
                    $selectors = me.$('.upfront-css-selectors'),
                    $saveform = me.$('.upfront-css-save-form'),
                    onResize = function(e, ui){
                        var height = ui ? ui.size.height : me.$('.upfront-css-resizable').height(),
                            bodyHeight = height  - topHeight;
                        $cssbody.height(bodyHeight);
                        if(me.editor)
                            me.editor.resize();
                        $selectors.height(bodyHeight - $saveform.outerHeight());
                        $('#page').css('padding-bottom', height);
                    }
                    ;
                onResize();
                this.$('.upfront-css-resizable').resizable({
                    handles: {n: '.upfront-css-top'},
                    resize: onResize,
                    minHeight: 200,
                    delay: 100
                });
            },
            remove: function() {
                this.trigger('close');
                Backbone.View.prototype.remove.call(this);
                $(window).off('resize', this.resizeHandler);
            },
            openImagePicker: function() {
                var me = this;
                Upfront.Media.Manager.open({}).done(function(popup, result){
                    Upfront.Events.trigger('upfront:element:edit:stop');
                    if(!result)
                        return;

                    var url = result.models[0].get('image').src;//.replace(document.location.origin, '');
                    me.editor.insert('url("' + url + '")');
                    me.editor.focus();
                });
            },
            startInsertFontWidget: function() {
                var insertFontWidget = new Fonts.Insert_Font_Widget({ collection: Fonts.theme_fonts_collection });
                $('#insert-font-widget').html(insertFontWidget.render().el);
            },
            addSelector: function(e) {
                var selector = $(e.target).data('selector');
                this.editor.insert(selector);
                this.editor.focus();
            }
        });
    });
}(jQuery));
