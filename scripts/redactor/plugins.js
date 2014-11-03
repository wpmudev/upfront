;(function($){

    var deps = [
        'text!scripts/redactor/ueditor-templates.html'
    ];

define("redactor_plugins", deps, function(tpl){

var UeditorEvents = _.extend({}, Backbone.Events);
    /* Panel helper
     ------------------------------*/

var UeditorPanel = Backbone.View.extend({
    initialize: function(options){
        var me = this;

        me.redactor = options.redactor;
        me.button = options.button;
        me.panel = options.panel;

        this.on('open', function(redactor){
            console.log('Panel open');
            me.$el.trigger('open', redactor);
        });
        this.on('closed', function(redactor){
            console.log('Panel closed');
            me.$el.trigger('closed', redactor);
        });

        this.render();
    },

    openToolbar: function(openPanel){
        var me = this;
        me.redactor.$air.show();
        me.redactor.airBindHide();
        if(openPanel){
            setTimeout(function(){
                if(!me.panel.is(':visible'))
                    me.button.click();
            }, 300);
        }
    },

    closeToolbar: function(){
        this.redactor.$air.fadeOut(100);
    },

    closePanel: function(){
        if(this.panel.is(':visible'))
            this.button.click();
    },

    disableEditorStop: function(){
        this.redactor.ueditor.disableStop = true;
    },

    enableEditorStop: function(){
        var me = this;
        setTimeout(function(){
            me.redactor.ueditor.disableStop = false;
        }, 300);
    },
    appendOkButton: function(text){
        var me = this;
        if(!me.$el.siblings('.ueditor-ok').length){
            text = text || 'Ok';
            var button = $('<a class="ueditor-ok">' + text + '</a>').on('click', function(e){
                me.$el.trigger('ok');
            });
            button.insertAfter(me.$el);
        }
    }
});


    /*-----------------------------
     PLUGINS
     -------------------------------*/

if (!RedactorPlugins) var RedactorPlugins = {};


/*
 STATE BUTTONS PLUGIN
 */
RedactorPlugins.stateButtons = function() {

    return {
        init: function () {
            this.$air = this.$toolbar.closest(".redactor_air");
            this.stateButtons.addStateButtons();
            this.stateButtons.startStateObserver();
        },
        addStateButtons: function () {
            //if (this.stateButtons)
            //    return;

            var me = this;
            //this.stateButtons = {};
            $.each(this.opts.stateButtons, function (id, data) {
                if ($.inArray(id, me.opts.airButtons) !== -1) {
                    var button = new me.stateButtons.StateButton(id, data);
                    var btn = me.button.add(id, data.title);
                    me.button.addCallback( btn, function () {
                        me.stateButtons.stateCallback(id, button)
                    });
                    // set state of button
                    me.$air.on("show", function () {
                        button.guessState(me);
                    });
                }

            });
        },
        stateCallback: function (id, button) {
            button.guessState(this);
            button.callback(id, this.button.get(id), button);
        },
        startStateObserver: function () {
            var observer = $.proxy(this.stateObserver, this);
            this.$element.on('mouseup.redactor keyup.redactor', observer);
        },

        stateObserver: function () {
            var me = this;
            $.each(this.stateButtons.stateButtons, function (id, button) {
                button.guessState(me);
            });
            me.waitForMouseUp = false; //Prevent handler bound to document.mouseup
        },

        StateButton: function (id, data) {
            var me = this,
                nextStates = {},
                previousState = false;
            firstState = false;
            ;

            me.id = id;
            me.currentState = data.defaultState;
            me.states = data.states;
            me.iconClasses = '';
            me.defaultState = data.defaultState;

            $.each(me.states, function (id, state) {
                if (previousState) {
                    nextStates[previousState] = id;
                }
                else
                    firstState = id;
                me.iconClasses += ' ' + state.iconClass;
                previousState = id;
            });
            nextStates[previousState] = firstState;

            me.nextStates = nextStates;

            me.nextState = function (el) {
                this.setState(me.nextStates[this.currentState], el);
            };
            me.setState = function (id, el) {
                this.currentState = id;
                el.removeClass(this.iconClasses)
                    .addClass(this.states[this.currentState].iconClass)
                ;
            };
            me.triggerState = function (redactor, name, el, button) {
                var callback = $.proxy(this.states[this.currentState].callback, redactor);
                callback(name, el, button);
            };
            me.guessState = function (redactor) {
                var found = false;
                $.each(this.states, function (id, state) {
                    found = state.isActive(redactor) ? id : found;
                });
                if (!found)
                    found = this.defaultState;
                this.setState(found, redactor.button.get(this.id));
            };
            me.getElement = function (redactor) {
                return redactor.button.get(this.id);
                return redactor.$toolbar.find('.re-' + this.id);
            };
            return {
                id: id,
                title: data.title,
                callback: function (name, el, button) {
                    button.nextState(el);
                    button.triggerState(this, name, el, button);
                },
                nextState: $.proxy(me.nextState, me),
                setState: $.proxy(me.setState, me),
                triggerState: $.proxy(me.triggerState, me),
                guessState: $.proxy(me.guessState, me)
            }
        }
    }
};



/*--------------------
 ALIGMENT BUTTON
 --------------------- */
RedactorPlugins.stateAlignment = function() {
    return {
        init: function(){
            var self = this;
            this.opts.stateButtons.stateAlign = {
                title: 'Text alignment',
                defaultState: 'left',
                states: {
                    left: {
                        iconClass: 'ueditor-left',
                        isActive: function(redactor){
                            var $parent = $(redactor.selection.getBlock());
                            if($parent.length && $parent[0].nodeType == 3)
                                $parent = $parent.parent();
                            return $parent.length && $parent.css('text-align') == 'left';
                        },
                        callback: function(name, el , button){
                            self.alignment.left();
                        }
                    },
                    center: {
                        iconClass: 'ueditor-center',
                        isActive: function(redactor){
                            var $parent = $(redactor.selection.getBlock());
                            if($parent.length && $parent[0].nodeType == 3)
                                $parent = $parent.parent();
                            return $parent.length && $parent.css('text-align') == 'center';
                        },
                        callback: function(name, el , button){
                            self.alignment.center();
                        }
                    },
                    right: {
                        iconClass: 'ueditor-right',
                        isActive: function(redactor){
                            var $parent = $(redactor.selection.getBlock());
                            if($parent.length && $parent[0].nodeType == 3)
                                $parent = $parent.parent();
                            return $parent.length && $parent.css('text-align') == 'right';
                        },
                        callback: function(name, el , button){
                            self.alignment.right();
                        }
                    },
                    justify: {
                        iconClass: 'ueditor-justify',
                        isActive: function(redactor){
                            var $parent = $(redactor.selection.getBlock());
                            if($parent.length && $parent[0].nodeType == 3)
                                $parent = $parent.parent();
                            return $parent.length && $parent.css('text-align') == 'justify';
                        },
                        callback: function(name, el , button){
                            self.alignment.justify();
                        }
                    }
                }
            }
        }
    }
};

RedactorPlugins.stateAlignmentCTA = {
    beforeInit: function(){
        var self = this;
        this.opts.stateButtons.stateAlignCTA = {
            title: 'Text alignment',
            defaultState: 'left',
            states: {
                left: {
                    iconClass: 'ueditor-left',
                    isActive: function(redactor){
                        //console.log('returned left' + (self.$element.length && self.$element.css('text-align') == 'left'));
                        return self.$element.length && self.$element.css('text-align') == 'left';

                    },
                    callback: function(name, el , button){

                        self.$element.css('text-align', 'left');
                        //.alignmentLeft();
                    }
                },
                center: {
                    iconClass: 'ueditor-center',
                    isActive: function(redactor){

                        //console.log('returned center' + (self.$element.length && self.$element.css('text-align') == 'center'));
                        return self.$element.length && self.$element.css('text-align') == 'center';

                    },
                    callback: function(name, el , button){

                        self.$element.css('text-align', 'center');

                    }
                },
                right: {
                    iconClass: 'ueditor-right',
                    isActive: function(redactor){

                        //console.log('returned right' + (self.$element.length && self.$element.css('text-align') == 'right'));
                        return self.$element.length && self.$element.css('text-align') == 'right';

                    },
                    callback: function(name, el , button){

                        self.$element.css('text-align', 'right');
                    }
                },
                justify: {
                    iconClass: 'ueditor-justify',
                    isActive: function(redactor){

                        //console.log('returned justify' + (self.$element.length && self.$element.css('text-align') == 'justify'));
                        return self.$element.length && self.$element.css('text-align') == 'justify';

                    },
                    callback: function(name, el , button){
                        self.$element.css('text-align', 'justify');
                    }
                }
            }
        }
    }
};

RedactorPlugins.stateLists = function() {

    return {
        init: function () {
            var self = this;
            this.opts.stateButtons.stateLists = {
                title: 'List style',
                defaultState: 'none',
                states: {
                    none: {
                        iconClass: 'ueditor-nolist',
                        isActive: function (redactor) {
                            var $parent = $(redactor.selection.getParent());
                            return $parent.length && $parent.css('text-align') == 'left';
                        },
                        callback: function (name, el, button) {
                            self.list.toggle("orderedlist");
                        }
                    },
                    unordered: {
                        iconClass: 'ueditor-unorderedlist',
                        isActive: function (redactor) {
                            var $parent = $(redactor.selection.getParent());
                            if ($parent.length) {
                                var list = $parent.closest('ul');
                                if (list.length)
                                    return list.closest('.ueditable').length;
                            }
                            return false;
                        },
                        callback: function (name, el, button) {
                            self.list.toggle("unorderedlist");
                        }
                    },
                    ordered: {
                        iconClass: 'ueditor-orderedlist',
                        isActive: function (redactor) {
                            var $parent = $(redactor.selection.getParent());
                            if ($parent.length) {
                                var list = $parent.closest('ol');
                                if (list.length)
                                    return list.closest('.ueditable').length;
                            }
                            return false;
                        },
                        callback: function (name, el, button) {
                            self.list.toggle("orderedlist");
                        }

                    }
                }
            }
        }
    }
};


RedactorPlugins.upfrontImages = {

    beforeInit: function () {
        var redactor = this;
        redactor.events.on("ueditor:stop", function () {
            ImagesHelper.Image.unbind_events();
        });
        redactor.events.on("ueditor:insert:media", function () {
            ImagesHelper.Gallery.to_html(redactor);
            ImagesHelper.Slider.to_html(redactor);
        });
        ImagesHelper.Image.redactor = redactor;
        ImagesHelper.Image.create_dialog();
        ImagesHelper.Image.bind_events();

        Upfront.Media.Transformations.add(ImagesHelper.Image.cleanup);
        Upfront.Media.Transformations.add(ImagesHelper.Gallery.from_html);
        Upfront.Media.Transformations.add(ImagesHelper.Slider.from_html);

        Upfront.Events.on("upfront:editor:image_align", function (el, align) { // Can we refactor upfront:editor:* events?
            var margin = false;
            if ("left" === align) margin = "margin-right";
            else if ("right" === align) margin = "margin-left";
            if (!margin) return false;
            $(el).css(margin, "15px");
        });
    }
};


RedactorPlugins.upfrontSink = {
    beforeInit: function(){
        var me = this;
        if(!Upfront.data.ueditor)
            Upfront.data.ueditor = {sink: false};
        this.opts.buttonsCustom.upfrontSink = {
            title: 'More tools'
        };
    },
    init: function(){
        var me = this,
            $button = this.$toolbar.find('.redactor_btn_upfrontSink').parent().addClass('upfront-sink-button'),
            sinkElements = this.$toolbar.find('.upfront-sink-button ~ li'),
            sink = $('<div class="ueditor-sink"></div>')
            ;

        $button.on('click', function(){
            if(Upfront.data.ueditor.sink){
                me.closeSink();
            }
            else{
                me.openSink();
            }
        });

        sinkElements.detach().appendTo(sink);
        this.$toolbar.append(sink);
        if(Upfront.data.ueditor.sink)
            this.$toolbar.addClass('ueditor-sink-open');

        sinkElements.each(function(){
            var link = $(this).find('a').attr('class').match(/redactor_btn_[^\s]*/g),
                id = false,
                box = false
                ;
            if(link.length)
                id = link[0].replace('redactor_btn_', '');

            box = me.$toolbar.find('.redactor-dropdown-box-' + id);
            if(box.length)
                box.css({'margin-top': '40px'});
        });
        this.$air.on('show', function(){
            if(Upfront.data.ueditor.sink)
                me.$air.css({top: me.$air.offset().top - 40});
        });
    },
    openSink: function(){
        Upfront.data.ueditor.sink = true;
        this.$toolbar.addClass('ueditor-sink-open');
        this.$air.css({top: this.$air.offset().top - 40});
    },
    closeSink: function(){
        Upfront.data.ueditor.sink = false;
        this.$toolbar.removeClass('ueditor-sink-open');
        this.$air.css({top: this.$air.offset().top + 40});
    }
};


RedactorPlugins.upfrontPlaceholder = {
    init: function () {

        var placeholder = this.placeholderText;//opts.placeholder;
        if (this.$element.attr('placeholder')) placeholder = this.$element.attr('placeholder');
        if (placeholder === '') placeholder = false;
        if (placeholder !== false)
        {
            this.placeholderRemoveFromEditor();
            this.$placeholder = this.$editor.clone(false);
            this.$placeholder.attr('contenteditable', false).removeClass('ueditable redactor_editor').addClass('ueditor-placeholder').html( this.opts.linebreaks ? placeholder : this.cleanParagraphy(placeholder) );
            this.$editor.after(this.$placeholder);
            if ( this.$editor.css('position') == 'static' )
                this.$editor.css('position', 'relative');
            this.$editor.css('z-index', 1);
            var editor_pos = this.$editor.position();
            this.$placeholder.css({
                'position': 'absolute',
                'z-index': '0',
                'top': editor_pos.top,
                'left': editor_pos.left,
                'right': this.$box.outerWidth() - (editor_pos.left + this.$editor.outerWidth())
            });
            this.opts.placeholder = placeholder;
            this.$editor.on('focus keyup', $.proxy(this.placeholderUpdate, this));
            this.placeholderUpdate();
        }
    },
    placeholderUpdate: function () {
        this.code.sync(); // sync first before get
        var html = this.get();
        if ( html == '' )
            this.$placeholder.show();
        else
            this.$placeholder.hide();
    }
};

/*-------------------
 Panel Buttons
 -------------------*/

RedactorPlugins.panelButtons = function () {

    return {
        init: function () {
            var self = this;

            $.each(this.opts.buttonsCustom, function (id, b) {
                if (b.panel) {
                    var $panel = $('<div class="redactor-dropdown ueditor_panel redactor-dropdown-box-' + id + '" style="display: none;">'),
                        $button = self.button.get(id)
                        ;

                    b.panel = new b.panel({redactor: self, button: $button, panel: $panel});
                    $panel.html(b.panel.$el);
                    $panel.appendTo( self.$toolbar );
                    b.dropdown = true;

                    $button.on('click', function () {
                        if ($button.hasClass('dropact')) {
                            self.selection.removeMarkers();
                            b.panel.trigger('open', self);
                        }
                        else {
                            b.panel.trigger('closed', self);
                        }
                    });
                    self.$editor.on('mouseup.redactor keyup.redactor', function () {
                        if ($button.hasClass('dropact')) { //It's open, so we close it
                            self.dropdownHideAll();
                            b.panel.trigger('closed', self);
                        }
                    });

                    $panel
                        .on('click keydown keyup', function (e) {
                            e.stopPropagation();
                        })
                    ;
                    if ($.inArray(id, self.opts.airButtons) === -1) return;
                    var btn = self.button.add(id, b.title);
                    self.button.addCallback( btn, function () {
                        var $button = self.button.get(id),
                            left = $button.position().left;

                        $(".re-icon").removeClass("redactor_act dropact");
                        $button.addClass("redactor_act dropact");
                        $(".redactor-dropdown").not($panel).hide();

                        $panel.css("left", left + "px").toggle();


                        /**
                         * Triggers panel open or close events
                         */
                        if ($panel.is(":visible") && typeof b.panel.open === "function") {
                            b.panel.open.apply(b.panel, [jQuery.Event("open"), self]);
                        } else {
                            if (typeof b.panel.close === "function") {
                                b.panel.close.apply(jQuery.Event("close"), [$.Event, self]);
                            }
                        }

                        /**
                         * Makes sure the last button's panel is kept under the toolbar
                         * @type {[type]}
                         */
                        var $last = $(".redactor-dropdown.ueditor_panel").last(),
                            lastDropdownLeft = left - $last.innerWidth() + $button.width();
                        $last.css("left", lastDropdownLeft + "px");
                    } );

                }
            });
        }
    }
};

/*--------------------
 Font icons button
 -----------------------*/
RedactorPlugins.upfrontIcons = function() {
    return {
        $sel: false,
        init: function () {
            this.opts.buttonsCustom.upfrontIcons = {
                title: 'Icons',
                panel: this.upfrontIcons.panel
            };
            UeditorEvents.on("ueditor:key:down", function (redactor, e) {
                if ($(redactor.selection.getParent()).hasClass("uf_font_icon") || $(redactor.selection.getCurrent()).hasClass("uf_font_icon")) {
                    if (!( e.keyCode < 48 || e.keyCode > 90 )) {
                        e.preventDefault();
                    }
                }
            });
        },
        panel: UeditorPanel.extend(_.extend({}, Upfront.Views.Mixins.Upfront_Scroll_Mixin, {
            tpl: _.template($(tpl).find('#font-icons').html()),
            events: {
                'click .ueditor-font-icon': 'insert_icon',
                // "change input.font-icons-top" : 'update_offset',
                'open': 'open',
                'closed': 'close'
            },
            render: function (options) {
                this.$el.html(this.tpl());
                this.stop_scroll_propagation(this.$el);
            },
            open: function (e, redactor) {
                this.redactor = redactor;
                this.redactor.selection.restore();
                this.set_current_icon();

                this.$el.parent().css({
                    left: 193
                });
            },
            close: function () {
                if (this.redactor) {
                    this.redactor.selection.removeMarkers();
                }
            },
            //      update_offset : function( e ){
            // console.log(this.$sel);
            //      	if( this.$sel && this.$sel.hasClass( "uf_font_icon" ) ){
            //      		window.$sel = this.$sel;
            //      		this.$sel.css("top", parseFloat( $(e.target).val() ) +  "px" );
            //      		this.redactor.selectionRestore();
            //      		this.redactor.sync();
            //      	}
            //      },
            insert_icon: function (e) {
                this.redactor.selection.restore(true, false);
                var $icon = $($(e.target).hasClass("ueditor-font-icon") ? $(e.target).html() : $(e.target).closest(".ueditor-font-icon").html()),
                    fontSize = this.$(".font-icons-size").val(),
                    top = this.$(".font-icons-top").val();
                $icon.css({
                    "font-size": fontSize + "px",
                    "top": top + "px"
                });
                this.redactor.insert.html($icon[0].outerHTML, true);
                this.redactor.code.sync();
                this.closePanel();
            },
            set_current_icon: function () {
                this.redactor.selection.restore(true, false);
                window.re = this.redactor;
                var $sel = $(this.redactor.selection.getParent()).eq(0),
                    self = this;

                if (!$sel.hasClass("uf_font_icon")) {
                    if ($sel.parent().hasClass("uf_font_icon")) {
                        $sel = $sel.parent()
                    }
                    ;
                }
                if ($sel.hasClass("uf_font_icon")) {
                    this.$(".font-icons-size").val(parseFloat($sel.css("font-size")));
                    this.$(".font-icons-top").val(parseFloat($sel.css("top")));

                    this.$(".upfront-font-icons-controlls input").on("change", function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        self.redactor.selectionSave();
                        self.redactor.bufferSet();
                        var val = $(this).val() + "px";

                        if ($(this).hasClass("font-icons-size")) {
                            $sel.css("font-size", val);
                        }

                        if ($(this).hasClass("font-icons-top")) {
                            $sel.css("top", val);
                        }
                        self.redactor.code.sync();

                        self.redactor.selection.restore();

                    });

                }
                self.redactor.code.sync();
            }

        }))
    }
};

/*--------------------
 Upfront link panel button
 -----------------------*/

RedactorPlugins.upfrontLink = function() {

    return {
        init: function () {
            this.opts.buttonsCustom.upfrontLink = {
                title: 'Link',
                panel: this.upfrontLink.panel
            };
        },
        openPanel: function () {
            var left = this.button.get("link").position().left;
            $(".redactor-dropdown-box-upfrontLink").css("left", left + "px").toggle();
        },
        panel: UeditorPanel.extend({
            tpl: _.template($(tpl).find('#link-tpl').html()),
            events: {
                open: 'open'
            },
            initialize: function () {
                this.linkPanel = new Upfront.Views.Editor.LinkPanel({button: true});
                this.bindEvents();
                UeditorPanel.prototype.initialize.apply(this, arguments);
            },
            render: function (options) {
                options = options || {};
                this.linkPanel.model.set({
                    url: options.url,
                    type: options.link || this.guessLinkType(options.url)
                });

                this.linkPanel.render();
                this.$el.html(this.linkPanel.el);
                this.linkPanel.delegateEvents();
            },
            open: function (e, redactor) {
                this.redactor = redactor;
                redactor.selection.save();
                var link = false;
                if (redactor.$element.hasClass('upfront_cta'))
                    link = redactor.$element;
                else
                    link = redactor.utils.isCurrentOrParent('A');

                if (link) {
                    this.render({url: $(link).attr('href'), link: this.guessLinkType($(link).attr('href'))});//this.render({url: $(link).attr('href'), link: $(link).attr('rel') || 'external'});
                }
                else
                    this.render();
            },
            close: function (e, redactor) {
                redactor.selection.restore();
            },
            unlink: function (e) {
                if (e)
                    e.preventDefault();

                if (this.redactor.$element.hasClass('upfront_cta'))
                    this.redactor.$element.attr('href', '#');
                else {
                    var text = this.redactor.selection.getHtml();
                    if ($.parseHTML(text).length > 1) {// there is html inside
                        this.redactor.insert.html(text, true);
                    } else {
                        this.redactor.link.unlink();
                    }
                }
            },
            link: function (url, type) {
                this.redactor.selection.restore();
                if (url) {
                    if (this.redactor.$element.hasClass('upfront_cta'))
                        this.redactor.$element.attr('href', url);
                    else {
                        var caption = this.redactor.selection.getHtml();
                        var link = this.redactor.utils.isCurrentOrParent('A');
                        if (link)
                            $(link).attr('href', url).attr('rel', type);
                        else
                            this.redactor.link.set(caption, url);
                            //this.redactor.insert.html('<a href="' + url + '" rel="' + type + '">' + caption + '</a>', true);
                    }
                }
            },

            bindEvents: function () {
                this.listenTo(this.linkPanel, 'link:ok', function (data) {
                    if (data.type == 'unlink')
                        this.unlink();
                    else
                        this.link(data.url, data.type);

                    this.closeToolbar();
                });

                this.listenTo(this.linkPanel, 'link:postselector', this.disableEditorStop);

                this.listenTo(this.linkPanel, 'link:postselected', function (data) {
                    this.enableEditorStop();
                    this.link(data.url, data.type);
                });
            },

            guessLinkType: function (url) {
                if (!$.trim(url))
                    return 'unlink';
                if (url.length && url[0] == '#')
                    return url.indexOf('#ltb-') > -1 ? 'lightbox' : 'anchor';
                if (url.substring(0, location.origin.length) == location.origin)
                    return 'entry';

                return 'external';
            }

        })
    }
};

RedactorPlugins.upfrontColor = function() {

    return {
        init: function () {
            this.opts.buttonsCustom.upfrontColor = {
                title: 'Color',
                panel: this.upfrontColor.panel
            };
        },
        panel: UeditorPanel.extend({
            current_color: false,
            current_bg: false,
            events: {
                'open': 'open'
            },
            close: function (e, redactor) {
                redactor.selection.restore();
            },
            setCurrentColors: function () {
                var current = this.redactor.selection.getCurrent();
                if ( current && ( ['SPAN', 'DIV', 'INLINE'].indexOf(  $(current).prop('tagName')  ) !== -1 || $(current).hasClass(".upfront_theme_colors") ) ) {

                    var bg_color = tinycolor($(current).css('background-color'));
                    this.current_color = $(current).css('color');
                    if (bg_color.getAlpha() > 0)
                        this.current_bg = $(current).css('background-color');
                }
                else {
                    this.current_color = this.current_bg = false;
                }
            },
            open: function (e, redactor) {
                this.updateIcon();
                this.setCurrentColors();
                this.redactor.selection.save();
                var self = this,
                    foreground_picker = new Upfront.Views.Editor.Field.Color({
                        spectrum: {
                            flat: true,
                            showAlpha: true,
                            appendTo: "parent",
                            showPalette: true,
                            localStorageKey: "spectrum.recent_colors",
                            maxSelectionSize: 10,
                            preferredFormat: "hex",
                            chooseText: "Ok",
                            showInput: true,
                            allowEmpty: true,
                            change: function (color) {
                                self.current_color = color;
                            },
                            move: function (color) {
                                redactor.selection.restore(true, false);
                                self.current_color = color;
                            }
                        }
                    }),
                    background_picker = new Upfront.Views.Editor.Field.Color({
                        blank_alpha: 0,
                        spectrum: {
                            flat: true,
                            showAlpha: true,
                            appendTo: "parent",
                            showPalette: true,
                            localStorageKey: "spectrum.recent_bgs",
                            maxSelectionSize: 10,
                            preferredFormat: "hex",
                            chooseText: "Ok",
                            showInput: true,
                            allowEmpty: true,
                            change: function (color) {
                                self.current_bg = color;
                            },
                            move: function (color) {
                                redactor.selection.restore(true, false);
                                self.current_bg = color;
                            }
                        }
                    });

                foreground_picker.render();
                this.$("#tabforeground-content").html(foreground_picker.el);

                background_picker.render();
                this.$("#tabbackground-content").html(background_picker.el);

                if (this.current_color) {
                    var color = tinycolor(self.current_color);
                    foreground_picker.$(".upfront-field-color").spectrum("option", "color", self.current_color);
                    foreground_picker.$(".upfront-field-color").spectrum("set", color);
                    foreground_picker.$(".sp-input").css({
                        "border-left-color": self.current_color
                    });
                    foreground_picker.render_sidebar_rgba(color.toRgb());
                    foreground_picker.update_input_val(color.toHexString());
                }
                else {
                    var color = tinycolor("#000000");
                    foreground_picker.$(".upfront-field-color").spectrum("option", "color", "#000000");
                    foreground_picker.$(".upfront-field-color").spectrum("set", color);
                    background_picker.$(".sp-input").css({
                        "border-left-color": "#000000"
                    });
                    foreground_picker.render_sidebar_rgba(color.toRgb());
                    foreground_picker.update_input_val(color.toHexString());
                }

                if (this.current_bg) {
                    var color = tinycolor(self.current_bg);
                    background_picker.$(".upfront-field-color").spectrum("option", "color", self.current_bg);
                    background_picker.$(".upfront-field-color").spectrum("set", color);
                    background_picker.$(".sp-input").css({
                        "border-left-color": self.current_bg
                    });
                    background_picker.render_sidebar_rgba(color.toRgb());
                    background_picker.update_input_val(color.toHexString());
                }
                else {
                    var color = tinycolor("rgba(0, 0, 0, 0)");
                    background_picker.$(".upfront-field-color").spectrum("option", "color", "rgba(0, 0, 0, 0)");
                    background_picker.$(".upfront-field-color").spectrum("set", color);
                    background_picker.$(".sp-input").css({
                        "border-left-color": "rgba(0, 0, 0, 0)"
                    });
                    background_picker.render_sidebar_rgba(color.toRgb());
                    background_picker.update_input_val(color.toHexString());
                }


                this.$(".sp-choose").on("click", function () {
                    self.updateColors();
                    self.closePanel();
                    self.closeToolbar();
                    self.redactor.dropdown.hideAll();
                });
            },
            render: function () {

                var tabforeground = $('<li id="tabforeground" class="active">').html('Text Color');
                var tabbackground = $('<li id="tabbackground">').html('Text Background');
                var tablist = $('<ul class="tablist">').append(tabforeground).append(tabbackground);

                var tabs = $('<ul class="tabs">').append($('<li id="tabforeground-content" class="active">').html('<input class="foreground" type="text">')).append($('<li id="tabbackground-content">').html('<input class="background" type="text">'));

                var redac = this.redactor;
                var self = this;

                redac.bufferAirBindHide = this.redactor.airBindHide;

                redac.airBindHide = function () {
                    self.updateIcon();
                    redac.bufferAirBindHide();
                };

                tablist.children('li').on('click', function () {
                    tablist.children('li').removeClass('active');
                    $(this).addClass('active');
                    tabs.children('li').removeClass('active');
                    tabs.children('li#' + $(this).attr('id') + '-content').addClass('active');

                    self.$('input.foreground').spectrum('option', 'color', typeof(self.current_color) == 'object' ? self.current_color.toRgbString() : self.current_color);
                    self.$('input.background').spectrum('option', 'color', typeof(self.current_bg) == 'object' ? self.current_bg.toRgbString() : self.current_bg);
                });

                this.$el.html(tablist).append(tabs);
                //redac.selectionSave();

            },
            updateIcon: function () {
                var self = this;
                self.setCurrentColors();
                if (self.current_bg) {
                    var color = tinycolor(self.current_bg);
                    if (color.getAlpha() === 0) {
                        this.redactor.$toolbar.find('.re-icon.re-upfrontColor').addClass('transparent').css('border-color', "");
                    } else {
                        this.redactor.$toolbar.find('.re-icon.re-upfrontColor').removeClass('transparent').css('border-color', color.toRgbString());
                    }
                }
                else {
                    this.redactor.$toolbar.find('.re-icon.re-upfrontColor').addClass('transparent').css('border-color', '');
                }


                if (self.current_color)
                    this.redactor.$toolbar.find('.re-icon.re-upfrontColor').css('color', self.current_color);
                else
                    this.redactor.$toolbar.find('.re-icon.re-upfrontColor').css('color', '');

            },
            updateColors: function () {

                var self = this,
                    parent = this.redactor.selection.getParent(),
                    bg = "";
                    bg_class = "",
                    html = "",
                    color_set = function(rule, type)
                    {
                        self.redactor.inline.format('div', 'style', rule + ': ' + type + ';');
                    },
                    color_remove = function(rule)
                    {
                        self.redactor.inline.removeStyleRule(rule);
                    };



                /**
                 * Set background color
                 */
                if (self.current_bg && typeof(self.current_bg) == 'object') {

                    color_remove( 'background-color' );
                    color_set( 'background-color',  self.current_bg.toRgbString() );
                    self.updateIcon();
                    self.redactor.selection.removeMarkers();
                    return;
                    this.redactor.inlineRemoveStyle("background-color");
                    bg = 'background-color:' + self.current_bg.toRgbString();
                    bg_class = Upfront.Views.Theme_Colors.colors.get_css_class(self.current_bg.toHexString(), true);

                    if (bg_class) {
                        bg = "";
                        bg_class += " upfront_theme_colors";
                    } else {
                        bg_class = "inline_color";
                    }

                    return;
                }

                /**
                 * Set font color
                 */
                if (self.current_color && typeof(self.current_color) == 'object') {


                    color_remove( 'color' );
                    color_set( 'color',  self.current_color.toRgbString() );
                    self.updateIcon();
                    self.redactor.selection.removeMarkers();
                    return;
                    var theme_color_classname = Upfront.Views.Theme_Colors.colors.get_css_class(self.current_color.toHexString());
                    if (theme_color_classname) { // it's a theme color
                        var current = this.redactor.getCurrent();
                        if (!$(current).hasClass(theme_color_classname)) {

                            this.redactor.selection.restore(true, true);
                            this.redactor.buffer.set();
                            this.redactor.$editor.focus();
                            this.redactor.inline.removeStyle("color");
                            this.redactor.inline.removeClass("upfront_theme_colors");
                            this.redactor.inline.removeClass("inline_color");
                            html = this.redactor.cleanHtml(this.redactor.cleanRemoveEmptyTags(this.redactor.selection.getHtml()));

                            html = "<inline class='upfront_theme_colors " + theme_color_classname + " " + bg_class + "' style='" + bg + "'>" + html + "</inline>";
                        }
                    } else {
                        // Making sure it doesn't have any theme color classes
                        _.each(Upfront.Views.Theme_Colors.colors.get_all_classes(), function (cls) {
                            self.redactor.inline.removeClass(cls);
                        });

                        this.redactor.selection.restore(true, true);
                        this.redactor.buffer.set();
                        this.redactor.$editor.focus();
                        this.redactor.inline.removeStyle("color");
                        this.redactor.inline.removeClass("upfront_theme_colors");
                        this.redactor.inline.removeClass("inline_color");

                        html = this.redactor.cleanHtml(this.redactor.cleanRemoveEmptyTags(this.redactor.selection.getHtml()));
                        html = "<inline class='inline_color' style='color: " + self.current_color.toRgbString() + ";" + bg + "'>" + html + "</inline>";

                    }
                }


                if (html === "") {
                    html = this.redactor.cleanHtml(this.redactor.cleanRemoveEmptyTags(this.redactor.selection.getHtml()));
                    html = "<inline class='" + bg_class + "' style='" + bg + "'>" + html + "</inline>";
                }

                this.redactor.insert.html(html, true);

                // Doing more cleanup
                if ($.trim($(parent).text()).localeCompare($.trim($(html).text())) === 0 && ( $(parent).hasClass("inline_color") || $(parent).hasClass("upfront_theme_colors") )) {
                    // $(parent).replaceWith( html );
                }

                self.updateIcon();
                self.redactor.selection.removeMarkers();
                //self.redactor.syncClean();
            }
        })
    }
};


RedactorPlugins.upfrontFormatting = function() {

    return {
        init: function () {
            var self = this,
                buttons = {},
                tags = {
                    p: 'P',
                    h1: 'H1',
                    h2: 'H2',
                    h3: 'H3',
                    h4: 'H4',
                    h5: 'H5',
                    h6: 'H6',
                    pre: '&lt;/&gt;',
                    blockquote: '"'
                };
            $.each(tags, function (id, tag) {
                buttons[id] = {title: tag, func: self.upfrontFormatting.applyTag};
            });
            if ($.inArray("upfrontFormatting", this.opts.airButtons) !== -1) {
                var button = this.button.add('upfrontFormatting', 'Formatting');
                this.button.addDropdown(button, buttons);
            }

            UeditorEvents.on("ueditor:dropdownShow", function () {
                var tag = $(self.selection.getBlock()).length ? $(self.selection.getBlock())[0].tagName : false;
                if (tag) {
                    tag = tag.toLowerCase();
                    $(".redactor-dropdown-box-upfrontFormatting a").removeClass("active");
                    $(".redactor-dropdown-" + tag).addClass("active");
                }
            });
        },
        applyTag: function (tag) {
            this.selection.restore(true, true);
            this.buffer.set();
            this.$editor.focus();
            var text_align = $(this.selection.getCurrent()).css("text-align");

            this.block.format(tag);

            //if (typeof text_align !== "undefined")
                //this.inline.toggleStyle("text-align", text_align);

            this.dropdown.hideAll();
        }
    }
};

RedactorPlugins.blockquote = function() {

    return {
        init: function () {
            var me = this;
            this.opts.stateButtons.blockquote = {
                title: 'Set a quote',
                defaultState: 'noquote',
                states: {
                    noquote: {
                        iconClass: 'ueditor-noquote',
                        isActive: function (redactor) {
                            var quote = redactor.blockquote.getQuote();
                            return !quote;
                        },
                        callback: function (name, el, button) {
                            if( me.utils.isCurrentOrParent(['BLOCKQUOTE']) ){
                                //me.block.formatBlockquote('blockquote');
                                //$( me.selection.getCurrent()).unwrap("<blockquote></blockquote>");
                                me.utils.replaceToTag(me.selection.getBlock(), 'p');
                            }
                        }
                    },
                    quote: {
                        iconClass: 'ueditor-quote',
                        isActive: function (redactor) {
                            var quote = redactor.blockquote.getQuote();
                            return quote && !$(quote).hasClass('upfront-quote-alternative');
                        },
                        callback: function (name, el, button) {
                            me.block.formatBlockquote('blockquote');
                        }
                    },
                    alternative: {
                        iconClass: 'ueditor-quote-alternative',
                        isActive: function (redactor) {
                            var quote = redactor.blockquote.getQuote();
                            return quote && $(quote).hasClass('upfront-quote-alternative');
                        },
                        callback: function (name, el, button) {
                            me.blockquote.getQuote().addClass('upfront-quote-alternative');
                        }
                    }
                }
            };

        },
        getQuote: function () {
            var quote = $(this.selection.getParent());
            if (quote.prop('tagName') == 'BLOCKQUOTE')
                return quote;
            quote = quote.closest('blockquote');
            return quote.closest('.redactor-box').length ? quote : false;
        }
    }
};

    window.RedactorPlugins = RedactorPlugins;
    return {
        UeditorEvents: UeditorEvents
    };
}); //End require

}(jQuery));
