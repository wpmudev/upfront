;(function($){
define("ueditor", [ // For require to include scripts in build and not load them separately they must be passes as an array and not variable that points to array
	'text!scripts/redactor/ueditor-templates.html',
	'scripts/redactor/ueditor-inserts',
    'redactor_plugins'
], function(tpl, Inserts, redactor_plugins){
var hackedRedactor = false;
var UeditorEvents = redactor_plugins.UeditorEvents;
$.fn.ueditor = function(options){
	var isMethod = false,
		elements = this,
		result
	;
	//Modify redactor to work as we need
	if(!hackedRedactor)
		hackRedactor();


	if (typeof options === 'string'){
		isMethod = true;
	}

	this.each(function(){
		var $el = $(this),
			ueditor = $el.data('ueditor')
		;
		if(ueditor){
			if(isMethod)
				result = ueditor.callMethod(options);
			else
				$.error('Ueditor is already instantiated');
		}
		else{
			if(isMethod)
				$.error('Can\'t call the ueditor method ' + options + '. Ueditor not initialized');
			else {
				// Initialize editor
				$el.data('ueditor', new Ueditor($el, options));
				if( options.autostart ){
					$el.data('ueditor').start();
				}
				Ueditor.prototype.redactorInitialized = true;
			}
		}
	});

	if ( this.length == 1 && typeof result != 'undefined' )
		return result;
	return this;
};

var hackRedactor = function(){
    
    // These lines override the Redactor's prefFormatting
    var clean = $.Redactor.prototype.clean();
    
    clean.savePreFormatting = function(html) {
        return html;
    };

    $.Redactor.prototype.clean = function () { return clean };
    
	// Make click consistent
	$.Redactor.prototype.airBindHide = function () {
		if (!this.opts.air || !this.$toolbar) return;

		var self = this,
            hideHandler = $.proxy(function(doc) {
			$(doc).on('mouseup.redactor', $.proxy(function (e) {
				if ($(e.target).closest(this.$toolbar).length === 0
					&& $(e.target).parents("#upfront-popup.upfront-postselector-popup").length === 0)
				{
					if (!self.selection.getText()) {

						if(self.$element.closest('li').hasClass('menu-item')) {
				    		var menu_item = self.$element.closest('li.menu-item').data('backboneview');
				    		menu_item.model['being-edited'] = false;
				    	}

						self.$air.fadeOut(100);
						$(".redactor-dropdown").hide();
						self.$toolbar.find(".dropact").removeClass("dropact");
						$(doc).off(e);
					}
				}
			}, this)).on('keydown.redactor', $.proxy(function (e) {
				if(e.keyCode === 91 && e.metaKey) return;
				if (e.which === this.keyCode.ESC) {
					//self.getSelection().collapseToStart();
				}
				self.$air.fadeOut(100);
				$(doc).off(e);
			}, this));
		}, this);

		// Hide the toolbar at events in all documents (iframe)
		hideHandler(document);
		if (this.opts.iframe) hideHandler(this.document);
	};

	//Change the position of the air toolbar
	$.Redactor.prototype.airShow = function (e, keyboard)
    {
        if( typeof e !== "undefined" && ( $(e.target).parents().is(".uimage-control-panel") || $(e.target).is(".upfront-icon") || $(e.target).is(".upfront-icon-button") || ( !_.isUndefined(e.target.contentEditable) && e.target.contentEditable === "false" ) || $(e.target).closest(".redactor-editor").attr("contentEditable") === "false"  ) ) return;
        //if( $(e.target).parents().is(".uimage-control-panel") || $(e.target).is(".upfront-icon") || $(e.target).is(".upfront-icon-button")) return;

        if (!this.opts.air || !( this.opts.buttons.length || this.opts.airButtons.length ) || !this.$toolbar) return;

		if(this.$element.closest('li').hasClass('menu-item')) {
    		var menu_item = this.$element.closest('li.menu-item').data('backboneview');

    		menu_item.model['being-edited'] = true;
    	}


        //var sel = Upfront.Util.clone(this.sel);
        //var range = Upfront.Util.clone( this.range );
        $('.redactor_air').hide();
        this.selection.createMarkers();



        var width = this.$air.width(),
            node1 = this.$editor.find('span#selection-marker-1'),
            node2 = this.$editor.find('span#selection-marker-2'),
            m1 = node1.offset(),
            m2 = node2.offset()
        ;

        /**
         * Restore selections in safari
         */
        if( this.utils.browser("safari")){
            if (node1.length !== 0 && node2.length !== 0)
            {
                this.caret.set(node1, 0, node2, 0);
            }
            else if (node1.length !== 0)
            {
                this.caret.set(node1, 0, node1, 0);
            }
            else
            {
                this.$editor.focus();
            }
        }


        // Make sure we have both dimentions before proceeding
        if (!m1 || !m2) {
            return false;
        }

        var bounds = m2.top < m1.top ? {top: m2.top - 55, left: m2.left, right: m1.left, i:2} : {top: m1.top - 55, left: m1.left, right: m2.left, i:1},
            atRight = false,
            $win = $(window),
            winRight = $win.width() + $win.scrollLeft(),
            center, parent
        ;
        //Hack to place the bar correctly with floating images
        if(m1.top != m2.top && bounds.left > bounds.right)
            bounds.right = bounds.left + 50;

        if(!this.airWidth){
            this.airWidth = width;
            this.$air.width(width);
        }
        if(bounds.right < bounds.left || bounds.right > winRight){
            var parent = this.$editor.find('#selection-marker-' + bounds.i).parent();
            bounds.right =  Math.min(winRight, parent.offset().left + parent.width());
        }

        center = Math.floor((bounds.right + bounds.left + 1) / 2);

        if(center + width / 2 > winRight){
            this.$air.addClass('at-right');
            if(center > winRight)
                center = winRight - 5;
            bounds.left = center - width;
        }
        else {
            this.$air.removeClass('at-right');
            bounds.left = center - Math.floor((width + 1) / 2);
        }




        this.$air.css({
            left: bounds.left  + 'px',
            top: bounds.top + 'px'
        }).show();

        /**
         * If redactor is to high for the user to see it, show it under the selected text
         */
        if( this.$air.offset().top < 0 ){
            var ey = e && e.clientY ? e.clientY : this.$box.height();
            this.$air.css({
                top : ey + 14 + this.$box.position().top + "px"
            });
            this.$air.addClass("under");
        }else{
            this.$air.removeClass("under");
        }

        this.airBindHide();
        this.$air.trigger('show');
        this.dropdown.hideAll();
        UeditorEvents.trigger("ueditor:air:show", this);
        this.selection.removeMarkers();
    };


	hackedRedactor = true;

    /**
     * Overrides Redactor internal methods
     *
     * Override redactor methods by adding them in here and then change the body of method
     *
     * @type {{inline: {format: Overriden_Methods.inline.format}}}
     */
    var Overriden_Methods = {
        utils: {
            isEndOfElement: function(element){
                if (typeof element == 'undefined')
                {
                    var element = this.$element;
                    if (!element) return false;
                }

                var offset = this.caret.getOffsetOfElement(element);
                var text = $.trim($(element).text()).replace(/\n\r\n/g, '');

                return (offset == text.length) ? true : false;
            }
        },
        inline: {
            format: function(tag, type, value)
            {
                // Stop formatting pre and headers
                //if (this.utils.isCurrentOrParent('PRE') || this.utils.isCurrentOrParentHeader()) return;

                var tags = ['b', 'bold', 'i', 'italic', 'underline', 'strikethrough', 'deleted', 'superscript', 'subscript'];
                var replaced = ['strong', 'strong', 'em', 'em', 'u', 'del', 'del', 'sup', 'sub'];

                for (var i = 0; i < tags.length; i++)
                {
                    if (tag == tags[i]) tag = replaced[i];
                }

                this.inline.type = type || false;
                this.inline.value = value || false;

                this.buffer.set();

                if (!this.utils.browser('msie'))
                {
                    this.$editor.focus();
                }

                 this.selection.get();

                if (this.range.collapsed)
                {
                    this.inline.formatCollapsed(tag);
                }
                else
                {
                    this.inline.formatMultiple(tag);
                }

                if( tag && -1 !== _.indexOf( ["em", "italic"],tag.toLowerCase() ) ){ // add fix for em to make it work with list tags
                        this.selection.selectElement( $(this.selection.getInlines()).find("em") );
                }

                if( tag &&  -1 !== _.indexOf( ["strong", "bold"], tag.toLowerCase() )  ){ //  add fix for strong to make it work with list tags
                    this.selection.selectElement( $(this.selection.getInlines()).find("strong") );
                }
            }
        },
        keydown: {
            /**
             * Overridden method from redactor core (@line 4849)
             *
             * We're overriding this method because of buggy logic in current redactor core.
             * The `this.selection.getBlock()` method can just as easily return a (bool)false,
             * and the original implementation doesn't account for that.
             *
             * @return {Boolean} Doesn't really matter, side-effects method
             */
            replaceDivToBreakLine: function()
            {
                var blockElem = this.selection.getBlock();
                if (!(blockElem || {}).innerHTML) return false; // so yeah, selection.getBlock() got us nowhere, bail out
                var blockHtml = blockElem.innerHTML.replace(/<br\s?\/?>/gi, '');
                if ((blockElem.tagName === 'DIV' || blockElem.tagName === 'P') && blockHtml === '' && !$(blockElem).hasClass('redactor-editor'))
                {
                    var br = document.createElement('br');

                    $(blockElem).replaceWith(br);
                    this.caret.setBefore(br);

                    this.code.sync();

                    return false;
                }
            }
        }
    };

	$.Redactor.prototype.events = UeditorEvents;

	// This method is only triggered via keyboard shortcuts, so override this
	// rather than overriding and re-implementing the shortcut dispatch.
	$.Redactor.prototype.shortcutsLoadFormat = function (e, cmd) {
		//e.preventDefault();
		Upfront.Util.log("Block styles keyboard shortcuts have been disabled");
	};

	$.Redactor.prototype.placeholderStart = function (html) {
		console.log('do nothing');
	};

	$.Redactor.prototype.button = function() {
		return {
            build: function(btnName, btnObject)
            {
                var $button = $('<a href="#" class="re-icon re-' + btnName + '" rel="' + btnName + '" title="'+btnObject.title+'" />').attr('tabindex', '-1');

                if (btnObject.func || btnObject.command || btnObject.dropdown)
                {
                    $button.on('touchstart click', $.proxy(function(e)
                    {
                        if ($button.hasClass('redactor-button-disabled')) return false;

                        var type = 'func';
                        var callback = btnObject.func;
                        if (btnObject.command)
                        {
                            type = 'command';
                            callback = btnObject.command;
                        }
                        else if (btnObject.dropdown)
                        {
                            type = 'dropdown';
                            callback = false;
                        }

                        this.button.onClick(e, btnName, type, callback);

                    }, this));
                }

                // dropdown
                if (btnObject.dropdown)
                {
                    var $dropdown = $('<div class="redactor-dropdown redactor-dropdown-box-' + btnName + '" style="display: none;">');
                    $button.data('dropdown', $dropdown);
                    this.dropdown.build(btnName, $dropdown, btnObject.dropdown);
                }



                return $button;
            },

            onClick: function(e, btnName, type, callback)
            {
                this.button.caretOffset = this.caret.getOffset();

                e.preventDefault();

                if (this.utils.browser('msie')) e.returnValue = false;

                if (type == 'command')
                {
                    this.inline.format(callback);
                }
                else if (type == 'dropdown')
                {
                    this.dropdown.show(e, btnName);
                }
                else
                {
                    var func;

                    if ($.isFunction(callback))
                    {
                        callback.call(this, btnName);
                        this.observe.buttons(e, btnName);
                    }
                    else if (callback.search(/\./) != '-1')
                    {
                        func = callback.split('.');
                        if (typeof this[func[0]] != 'undefined')
                        {
                            this[func[0]][func[1]](btnName);
                            this.observe.buttons(e, btnName);
                        }
                    }
                    else
                    {
                        this[callback](btnName);
                        this.observe.buttons(e, btnName);
                    }
                }
            },
            get: function(key)
            {
                return this.$toolbar.find('a.re-' + key);
            },
            setActive: function(key)
            {
                this.button.get(key).addClass('redactor-act');
            },
            setInactive: function(key)
            {
                this.button.get(key).removeClass('redactor-act');
            },
            setInactiveAll: function(key)
            {
                if (typeof key == 'undefined')
                {
                    this.$toolbar.find('a.re-icon').removeClass('redactor-act');
                }
                else
                {
                    this.$toolbar.find('a.re-icon').not('.re-' + key).removeClass('redactor-act');
                }
            },
            setActiveInVisual: function()
            {
                this.$toolbar.find('a.re-icon').not('a.re-html').removeClass('redactor-button-disabled');
            },
            setInactiveInCode: function()
            {
                this.$toolbar.find('a.re-icon').not('a.re-html').addClass('redactor-button-disabled');
            },
            changeIcon: function(key, classname)
            {
                this.button.get(key).addClass('re-' + classname);
            },
            removeIcon: function(key, classname)
            {
                this.button.get(key).removeClass('re-' + classname);
            },
            setAwesome: function(key, name)
            {
                var $button = this.button.get(key);
                $button.removeClass('redactor-btn-image').addClass('fa-redactor-btn');
                $button.html('<i class="fa ' + name + '"></i>');
            },
            addCallback: function($btn, callback)
            {
                var type = (callback == 'dropdown') ? 'dropdown' : 'func';
                var key = $btn.attr('rel');
                $btn.on('touchstart click', $.proxy(function(e)
                {
                    if ($btn.hasClass('redactor-button-disabled')) return false;
                    this.button.onClick(e, key, type, callback);

                }, this));
            },
            addDropdown: function($btn, dropdown)
            {
                var key = $btn.attr('rel');
                this.button.addCallback($btn, 'dropdown');

                var $dropdown = $('<div class="redactor-dropdown redactor-dropdown-box-' + key + '" style="display: none;">');
                $btn.data('dropdown', $dropdown);

                if (dropdown)
                {
                    this.dropdown.build(key, $dropdown, dropdown);
                }

                return $dropdown;
            },
            add: function(key, title)
            {
                if (!this.opts.toolbar) return;

                var btn = this.button.build(key, { title: title });
                btn.addClass('redactor-btn-image');

                this.$toolbar.append($('<li>').append(btn));

                return btn;
            },
            addFirst: function(key, title)
            {
                if (!this.opts.toolbar) return;

                var btn = this.button.build(key, { title: title });
                this.$toolbar.prepend($('<li>').append(btn));

                return btn;
            },
            addAfter: function(afterkey, key, title)
            {
                if (!this.opts.toolbar) return;

                var btn = this.button.build(key, { title: title });
                var $btn = this.button.get(afterkey);

                if ($btn.size() !== 0) $btn.parent().after($('<li>').append(btn));
                else this.$toolbar.append($('<li>').append(btn));

                return btn;
            },
            addBefore: function(beforekey, key, title)
            {
                if (!this.opts.toolbar) return;

                var btn = this.button.build(key, { title: title });
                var $btn = this.button.get(beforekey);

                if ($btn.size() !== 0) $btn.parent().before($('<li>').append(btn));
                else this.$toolbar.append($('<li>').append(btn));

                return btn;
            },
            remove: function(key)
            {
                this.button.get(key).remove();
            }
        };
	};


    $.Redactor.prototype.bindModuleMethods =  function(module)
    {

        if (typeof this[module] == 'undefined') return;

        // init module
        this[module] = this[module]();

        var methods = this.getModuleMethods(this[module]);
        var len = methods.length;

        // bind methods
        for (var z = 0; z < len; z++)
        {
            var method = this[module][methods[z]];
            if( Overriden_Methods[module] && Overriden_Methods[module][methods[z]] )
                method =  Overriden_Methods[module][methods[z]];

            this[module][methods[z]] = method.bind(this);
        }
    };

    var l10n = Upfront.Settings && Upfront.Settings.l10n
        ? Upfront.Settings.l10n.global.ueditor
        : Upfront.mainData.l10n.global.ueditor
    ; 

    /**
     * Proxy the Redactor l10n
     * This is so we're using Redactor string handling
     * with our own delivery mechanism.
     */
    $.Redactor.opts.langs['upfront'] = $.extend({}, $.Redactor.opts.langs['en'], {
        bold: l10n.bold,
        italic: l10n.italic
    });


};

var Ueditor = function($el, options) {
    this.active = false;
	//Allow user disable plugins
	var plugins = this.pluginList(options),
        self = this,
        unique_id = Upfront.Util.get_unique_id("redactor");
    this.$el = $el;
    this.$air = $("<div class='redactor_air upfront-ui'></div>").attr("id", unique_id ).hide();
    $("body").append(this.$air);
    if( !_.isEmpty(options.airButtons) ){
        options.buttons = options.airButtons;
    }
    this.options = $.extend({
			// Ueditor options
			autostart: true, //If false ueditor start on dblclick and stops on blur
            autoexit: false,
			stateButtons: {},
            toolbarExternal: "#" + unique_id,
            // toolbarFixedTopOffset: 100,
        	// Redactor options
			air:true,
			linebreaks: true,
			disableLineBreak: false,
			focus: true,
			cleanup: false,
			plugins: plugins,
			airButtons: ['upfrontFormatting', 'bold', 'italic', 'blockquote', 'upfrontLink', 'stateLists', 'stateAlign', 'upfrontColor', 'upfrontIcons'],
            buttons: [ 'upfrontFormatting', 'bold', 'italic', 'blockquote', 'upfrontLink', 'stateLists', 'stateAlign', 'upfrontColor', 'upfrontIcons'],
			//buttons: ['formatting', 'bold', 'italic', 'deleted'],
			buttonsCustom: {},
			activeButtonsAdd: {},
			observeLinks: false,
			observeImages: false,
			formattingTags: ['h1', 'h2', 'h3', 'h4', 'p', 'pre'],
            inserts: ["image", "embed"],
            linkTooltip: false,
            cleanOnPaste: true, // font icons copy and paste wont work without this set to true - BUT, with it set to true, paste won't work AT ALL!!!
            replaceDivs: false,
            pastePlainText: false,
			imageEditable: false,
            replaceDivs: false,
            //cleanStyleOnEnter: false,
            //removeDataAttr: false,
            removeEmpty: false,
            imageResizable: false,
            lang: 'upfront' // <-- This is IMPORTANT. See the l10n proxying bit in `hackRedactor`
		}, options)
	;
	/* --- Redactor allows for single callbacks - let's dispatch events instead --- */
	this.options.dropdownShowCallback = function () { UeditorEvents.trigger("ueditor:dropdownShow", this); };
	this.options.dropdownHideCallback = function () { UeditorEvents.trigger("ueditor:dropdownHide", this); };
	this.options.initCallback = function () { UeditorEvents.trigger("ueditor:init", this); };
	this.options.changeCallback = function (e) { UeditorEvents.trigger("ueditor:change", this, e); };
	//this.options.pasteBeforeCallback = function (html) { UeditorEvents.trigger("ueditor:paste:before", this, html); }; //events can return anything so it's useless
	//this.options.pasteCallback = function (html) { UeditorEvents.trigger("ueditor:paste:after", this, html); }; //events can return anything so it's useless
	this.options.focusCallback = function () { UeditorEvents.trigger("ueditor:focus", this); };
	this.options.blurCallback = function () { UeditorEvents.trigger("ueditor:blur", this); };
	this.options.keyupCallback = function (e) { UeditorEvents.trigger("ueditor:key:up", this); };
	this.options.keydownCallback = function (e) { UeditorEvents.trigger("ueditor:key:down", this, e); };
	this.options.textareaKeydownCallback = function () { UeditorEvents.trigger("ueditor:key:down:textarea", this); };
	this.options.syncBeforeCallback = function (html) { UeditorEvents.trigger("ueditor:sync:before", this, html); return html; }; // <-- OOOH this one is different
	this.options.syncCallback = function (html) { UeditorEvents.trigger("ueditor:sync:after", this, html); $el.trigger('syncAfter', html); }; //Added syncAfter for east saving.
	this.options.autosaveCallback = function () { UeditorEvents.trigger("ueditor:autosave", this); };
	this.options.execCommandCallback = function (cmd, param) { UeditorEvents.trigger("ueditor:exec:" + cmd, this, param); }; // Do we need this? Yes, restore inserts on undo
	this.options.destroyCallback = function () { UeditorEvents.trigger("ueditor:destroy", this); };
	this.options.clickCallback = function (e) { UeditorEvents.trigger("ueditor:click", this, e); };
	// Also available ueditor events (not redactor callbacks:
		// ueditor:start
		// ueditor:stop
		// ueditor:method:<method>

	this.id = 'ueditor' + (Math.random() * 10000);

	if(this.options.autostart){
		if(this.options.startoninit)
			this.start();

		//this.startPlaceholder();
	}
	else {
		this.bindStartEvents();
		this.startPlaceholder();
	}

	//this.startPlaceholder();
	this.options.pasteCallback = function (html) {

        /**
         * When pasting unformatted text with line breaks, the lines get wrapped
         * in DIV tags. This is due to browser's handling of pasted content inside
         * div having contenteditable=true. For our requirement, we have to replace
         * it with P tags instead, in addition we have to make custom replacements
         * for different use cases.
         */
        html = html.replace(/<div>/g, "<p>").replace(/<\/div>/g,"</p>");

        // release br caught within empty p tags
        html = html.replace(/<p><br><\/p>/g, "<br>");
        html = html.replace(/<p ([^>]*)><br><\/p>/g, "<br>");

        // if two consecutive paragraphs without a line break inbetween
        // merge the paragraphs and sepearate text with a br
        html = html.replace(/<\/p><p>/g, "<br>");
        html = html.replace(/<\/p><p ([^>]*)>/g, "<br>");

        // if a single line break between two paragraph
        // take out the line break
        html = html.replace(/<\/p><br><p>/g, "</p><p>");
        html = html.replace(/<\/p><br><p ([^>]*)>/g, "</p><p $1>");

        // if multile breaks between 2 paragraphs, replace with blank paragraph
        html = html.replace(/<\/p>([<br>])*<p>/g, "</p><p></p><p>");
        html = html.replace(/<\/p>([<br>])*<p ([^>]*)>/g, "</p><p></p><p $1>");



		/**
		 * If a font icon is copied to clipboard, paste it
		 */
		if( typeof self.font_icon !== "undefined" && self.font_icon !== false){
			return self.font_icon;
		}
		return html;
	};



    // Enter callback inside lists 
    this.options.enterCallback = function (e) { 
        // Current Block is a list item
        if(this.keydown.block.tagName === 'LI') {
            var current = this.selection.getCurrent(),
                $parent = $(current).closest('li'),
                $list = $parent.parent('ul,ol'),
                $listlist = $list.parent('li').parent('ul,ol'),
                emptyList = '<li>&#x200b;</li>'
            ;

            // Sublist to list
            if (
                $parent.length !== 0 && 
                $listlist.length !== 0 &&
                this.utils.isEmpty($parent.html()) && 
                $list.next().length === 0
            ) {
                var node = $(emptyList);
                $listlist.append(node);
                this.caret.setStart(node);
                $parent.remove();

                return false;
            }
            // List to paragraph
            else if (
                $parent.length !== 0 && 
                this.utils.isEmpty($parent.html()) && 
                $list.next().length === 0
            ) {
                var node = $(this.opts.emptyHtml);
                $list.after(node);
                this.caret.setStart(node);
                $parent.remove();

                return false;
            }
            // List 
            else {
                UeditorEvents.trigger("ueditor:enter", this, e);
            }
        }
        // Default
        else {        
            UeditorEvents.trigger("ueditor:enter", this, e);
        }
    };

};


/**
 * Make sure selection of text show's the air buttons
 */
UeditorEvents.on("ueditor:key:up", function(redactor){
    if( !_.isEmpty( redactor.selection.getText() ) ){
        redactor.airShow();
    }
});


Ueditor.prototype = {
	disableStop: false,
	mouseupListener: false,

	start: function(){
		var self = this;
		this.stopPlaceholder();
		this.hideLinkFlags();
        this.$el.addClass('ueditable')
			.removeClass('ueditable-inactive')
			.attr('title', '')
			.redactor(this.options)
		;
		this.$el.trigger('start', this);
		this.redactor = this.$el.data('redactor');
        this.redactor.$air = this.$air;
        this.redactor.ueditor = this;
		this.preventDraggable();
		UeditorEvents.trigger('ueditor:start', this.redactor);

		if(!Upfront.data.Ueditor)
			Upfront.data.Ueditor = {instances: {}};
		Upfront.data.Ueditor.instances[this.id] = this;

		//Open the toolbar when releasing selection outside the element
		this.mouseupListener = $.proxy(this.listenForMouseUp, this);
		this.$el.on('mousedown', this.mouseupListener);


		this.$el.on('keydown', function(e){
			self.cmdKeyA = false;
			self.cmdKey = false;

            /**
             * Clean unverified spans and remove their style attr
             */
            _.delay(function() {
                if (e.keyCode === 8) {
                    self.redactor.clean.clearUnverified();
                    self.redactor.$editor.find('span').not('[data-verified="redactor"]').removeAttr('style');
                }
            }, 2);

			setTimeout(function(){
				if(e.keyCode === 65 && e.metaKey ){
					self.cmdKeyA = true;
				}

				if(e.keyCode === 91 && e.metaKey ){
					self.cmdKey = true;
				}

				if(e.keyCode === 67 && e.metaKey ){
					self.onCopy(e);
				}
			});

            // Expand known text patterns
            if (32 === e.keyCode) self.expand_known_text_patterns();

			if( ( e.keyCode != 37 && e.keyCode != 39 ) && self.redactor ) {
				var current = $(self.redactor.selection.getCurrent());
				if(current.hasClass('uf_font_icon')) {
					self.redactor.caret.setAfter(current);
				}
				else if(current.parent().hasClass('uf_font_icon')) {
					self.redactor.caret.setAfter(current.parent());
				}

			}

		});


        // Open air when selecting text with keyboard
		this.$el.on('keyup', function(e){
			if(self.redactor && self.redactor.selection.getText() &&  [37, 38, 39, 40].indexOf( e.keyCode ) !== -1 || (e.keyCode === 65 && e.ctrlKey) || (self.cmdKeyA)  ){
				self.redactor.airShow(e);
			}
		});

		if(this.options.inserts){
			this.insertsSetUp();
		}

		//Listen for outer clicks to stop the editor if necessary
		if(!this.options.autostart || this.options.autoexit)
			this.listenToOuterClick();

		$(document).on("keyup", $.proxy(this.stopOnEscape, this));

		this.active = true;

        this.$el.on('keyup', function(e) {
            /**
             * Make sure return doesn't delete the last charactor
             */
            if (13 === e.keyCode && !e.shiftKey && (self || {}).redactor && !self.redactor.keydown.pre && !self.redactor.$air.is(":visible") ) {
                self.redactor.utils.removeEmpty();
                $(self.redactor.selection.getCurrent()).append("&#x200b;");
            }
        });

	},
	stopOnEscape: function(e) {
			if(e.keyCode === 27 && !( $(".upfront-content-marker-contents").length && $(".upfront-content-marker-contents").data("ueditor") ) ){
				this.stop();
			}
	},

    /**
     * Expand the known text patterns in current block element
     */
    expand_known_text_patterns: function (e) {
        var redactor = this.redactor,
            rpl = {
                '##': {tag: 'h2'},
                '###': {tag: 'h3'},
                '####': {tag: 'h4'},
                '#####': {tag: 'h5'},
                '######': {tag: 'h6'},
                '>': {tag: 'blockquote'},
                '-': {tag: 'ul', nest: 'li'},
                '*': {tag: 'ul', nest: 'li'},
                '1.': {tag: 'ol', nest: 'li'},
                '1)': {tag: 'ol', nest: 'li'}
            }
        ;
        if (!redactor) return;

        redactor.selection.get();

        var node = redactor.selection.getBlock(),
            caret, $el, check
        ;
        if (!node) return;

        caret = redactor.caret.getOffsetOfElement(node);
        if (!caret) return;
        
        $el = $(node).clone();
        check = $el.text().substr(0, caret);

        if (!check) return;

        $.each(rpl, function (src, target) {
            if (src !== check) return true;

            var $node = $(node),
                rx = new RegExp('^' + src.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1") + ' ?'),
                text = $node.text().replace(rx, '')
            ;

            // Let's not do nested lists
            // or expansion within lists in general
            // or in PRE tags
            if ($node.is("li,ul,ol,pre")) return false;

            // Replace the selection tag with the one from the replacement map
            if ("nest" in target && target.nest) {
                $node.html(
                    '<' + target.tag + '><' + target.nest + '>' +
                        text + 
                    '</' + target.nest + '></' + target.tag + '>'
                );
            } else {
                var _node = document.createElement(target.tag);
                _node.innerHTML = text;
                $node.replaceWith( _node );

            }

            // Set caret position to end of the target
            redactor.caret.setEnd(
                "nest" in target && target.nest
                    ? $node.find(target.nest).last().get()
                    : _node
            );

            redactor.code.sync();
            /**
             * Make sure the created node doesn't contain the space created by the spacebar!
             */
            _.delay( function(){
               $(redactor.selection.getBlock()).html(text);
            }, 3 );


            return false;
        });
    },

	stop: function(){
		if(this.redactor){
			UeditorEvents.trigger('ueditor:stop', this.redactor);
			this.$el.trigger('stop');
			this.restoreDraggable();
            if( this.redactor.$toolbar )
			    this.redactor.core.destroy();
            this.$air.remove();
            this.$el.removeClass('ueditable');
            this.redactor = false;
		}
		if ("undefined" !== typeof Upfront.data.Ueditor) delete Upfront.data.Ueditor.instances[this.id];
		this.startPlaceholder();
		$("html").off('mousedown', this.stopOnOutsideClick);
		$(document).off('keyup', this.stopOnEscape);
        this.active = false;
	},

	bindStartEvents: function() {
		var me = this;

		me.$el.addClass('ueditable-inactive')
			.attr('title', 'Double click to edit the text')
            .addClass('uf-click-to-edit-text')
			.one('dblclick', function(e){
				e.preventDefault();
				e.stopPropagation();
				if(!me.redactor)
					me.start(e);
			})
		;



		if(me.$el.prop('tagName') == 'DIV') {
			me.$el.on('click', 'i.visit_link', function() {
				me.visitLink($(this).attr('data-href'));
			});

			me.$el.on('mouseover', function() {
				if(me.$el.hasClass('ueditable-inactive'))
					me.displayLinkFlags();
			});
			me.$el.on('mouseout', function(e) {
				if($(e.relatedTarget).hasClass('visit_link'))
					return;
				me.hideLinkFlags();

			});
		}

        // Add warning flags to all the lightbox links if the lightbox is missing
        this.$el.find('a').each(function(){
            var href = $(this).attr('href');
            if(href && href.indexOf('#ltb-') > -1 && !Upfront.Util.checkLightbox(href))
                $(this).addClass('missing-lightbox-warning');
        });
	},
	displayLinkFlags: function() {
		var me = this;
		this.$el.find('a').each(function(){
			if($(this).find('i.visit_link').length > 0 || !$(this).attr('href') || $(this).text().trim() == '')
				return;
			$(this).css('position', 'relative');
			$(this).append('<i class="visit_link visit_link_'+me.guessLinkTypeTag($(this))+'" data-href="'+$(this).attr('href')+'"></i>');
			$(this).removeAttr('href');
			//$(this).attr('onclick', 'return false;');
		});
	},
	hideLinkFlags: function(area)  {
		this.$el.find('a').each(function() {
			$(this).css('position', '');
			$(this).attr('href', $(this).children('i.visit_link').attr('data-href'));
			$(this).children('i.visit_link').remove();
			//$(this).attr('onclick', '');
		});
	},
	visitLink: function(url) {
		var me = this;
		var linktype = me.guessLinkType(url);
		if(linktype == 'lightbox') {
			var regions = Upfront.Application.layout.get('regions');
			region = regions ? regions.get_by_name(me.getUrlanchor(url)) : false;
			if(region){
				//hide other lightboxes
				_.each(regions.models, function(model) {
					if(model.attributes.sub == 'lightbox')
						Upfront.data.region_views[model.cid].hide();
				});
				var regionview = Upfront.data.region_views[region.cid];
				regionview.show();
			}
		}
		else if(linktype == 'anchor') {
			var anchors = me.get_anchors();
			$('html,body').animate({scrollTop: $('#'+me.getUrlanchor(url)).offset().top},'slow');
		}
		else if(linktype == 'entry')
			window.location.href = url.replace('&editmode=true', '').replace('editmode=true', '')+((url.indexOf('?')>0)?'&editmode=true':'?editmode=true');
		else
			window.open(url);
	},
    /*validateEmail: function (email) {
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    },*/
    guessLinkTypeTag: function(item){
        return item.data('upfront-link-type');
    },
	guessLinkType: function(url){
        var anchor = false;
		if(!$.trim(url) || $.trim(url) == '#')
			return 'unlink';

        if(url.indexOf('#') > -1) {
            anchor =this.getUrlanchor(url);
        }

		if(anchor) {
			return url.indexOf('ltb-') > -1 ? 'lightbox' : 'anchor';
        }
        // is it an email.
        if(url.indexOf('mailto:') === 0) {
            return 'email';
        }

		if(url.substring(0, location.origin.length) == location.origin)
			return 'entry';

		return 'external';
	},
	get_anchors: function () {
		var regions = Upfront.Application.layout.get("regions"),
			anchors = [];
		;
		regions.each(function (r) {
			r.get("modules").each(function (module) {
				if(module.get("objects")) {
                    module.get("objects").each(function (object) {
    					var anchor = object.get_property_value_by_name("anchor");
    					if (anchor && anchor.length) anchors[anchor] = object;
    				});
                }
			});
		});
		return anchors;
	},
	getUrlanchor: function(url) {
		// this does almost the opposite of the above function

		if(typeof(url) == 'undefined') var url = $(location).attr('href');

		if(url.indexOf('#') >=0) {
			var tempurl = url.split('#');
			return tempurl[1];
		} else return false;
	},
	insertsSetUp: function(){
		var me = this,
			manager = new InsertManager({el: this.$el, insertsData: this.options.insertsData, inserts: this.options.inserts, ueditor: this}),
			redactorEvents = this.redactor.events
		;

		this.insertManager = manager;

		var handler = $.proxy(manager.bindTriggerEvents, manager);
		redactorEvents.on("ueditor:init", handler);
		redactorEvents.on("ueditor:enter", handler);
		redactorEvents.on("ueditor:insert:media", handler);
		redactorEvents.on("ueditor:sync:after", function(){
			me.insertManager.parseMarkup();
		});

		manager.on('insert:prechange', function(){
			//TODO: focus before bufferSet

			//Store the state to allow undo
			var selection = me.redactor.selection.get();
			me.redactor.buffer.set();
		});
		this.manager = manager;
		this.redactorEvents = redactorEvents;
		manager.on('insert:added insert:removed', function(){
			me.redactor.events.trigger("ueditor:insert:media");
			if (me.redactor.code && me.redactor.code.sync) me.redactor.code.sync();
		});
		UeditorEvents.on( 'cleanUpListeners', $.proxy(this.cleanUpListeners, this));
	},
	cleanUpListeners: function() {
		this.redactorEvents.off("ueditor:init");
		this.redactorEvents.off("ueditor:enter");
		this.redactorEvents.off("ueditor:insert:media");
		this.redactorEvents.off("ueditor:sync:after");
		this.manager.off('insert:prechange');
		this.manager.off('insert:added insert:removed');
		$("html").off('mousedown', this.stopOnOutsideClick);
		this.redactorEvents.off('cleanUpListeners');
		$(document).off('click.redactor-image-delete');
	},

	listenToOuterClick: function(){
		var me = this;

		if(!this.checkInnerClick){
			this.checkInnerClick = function(e){
				//Check we are not selecting text
				/*var selection = document.getSelection ? document.getSelection() : document.selection;
				if(selection && selection.type == 'Range')
					return;
				*/
				//Check if the click has been inner, or inthe popup, otherwise stop the editor
				if(!me.options.autostart && me.redactor){
					//var $target = $(e.target);
					//if(!me.disableStop && !$target.closest('.redactor_air').length && !$target.closest('.ueditable').length){
					//	me.stop();
					//	me.bindStartEvents();
					//}
					me.stop();
				}
			};
		}
		$("html").on('mousedown', {ueditor : me}, this.stopOnOutsideClick);
	},
	stopOnOutsideClick: function(e){
		if( !( $(e.target).hasClass("redactor_box")
				|| $(e.target).parents().hasClass("redactor-box")
				|| $(e.target).parents().hasClass("redactor_air")
                || $(e.target).parents().hasClass("redactor-toolbar")
                || $(e.target).parents().hasClass("use_selection_container") // Todo Sam:, make this more general
                || $(e.target).parents().is("#upfront-popup")
                || $(e.target).parents().hasClass("upfront-inserts-markup-editor")
				|| $(e.target).parents().hasClass("redactor-dropdown"))
			&& $(e.target).parents("#upfront-popup.upfront-postselector-popup").length === 0)
		{
            if(e.data.ueditor.$el.closest('a.menu_item').length > 0) { // blur on the menu item, dont stop the editor yet 
                e.data.ueditor.$el.trigger('blur');
            }
            else {
    			e.data.ueditor.stop();
            }
		}
	},
	callMethod: function(method){
		var result = this.$el.redactor(method);
		UeditorEvents.trigger("ueditor:method:" + method, this.$el.redactor);
		return result;
	},
	startPlaceholder: function() {

		var placeholder = this.options.placeholder;
		if (this.$el.attr('placeholder')) placeholder = this.$el.attr('placeholder');
		if (placeholder === '') placeholder = false;
		if (placeholder !== false && $.trim(this.$el.text()).length === 0)
		{
			//remove existing placeholder
			this.$el.parent().children('.ueditor-placeholder').remove();
			this.$placeholder = this.$el.clone(false);
			this.$placeholder.attr('contenteditable', false).removeClass('ueditable redactor_editor').addClass('ueditor-placeholder').html(placeholder);
			this.$el.after(this.$placeholder);

			var $parent = this.$el.parent();
			if ($parent.css('position') == 'static')
				$parent.css('position', 'relative');
			if (this.$el.css('position') == 'static' )
				this.$el.css('position', 'relative');
			this.$el.css('z-index', 1);
			var pos = this.$el.position();
			this.$placeholder.css({
				'position': 'absolute',
				'z-index': '0',
				'top': pos.top,
				'left': pos.left,
				'right': $parent.outerWidth() - (pos.left + this.$el.outerWidth())
			});

			//Make sure that the editor has one line of text
			this.$el.html('&nbsp;');
			this.options.placeholder = placeholder;
			var me = this;

			//setTimeout(function() { console.log(me.$el.parent().html());}, 200);
		}
	},
	stopPlaceholder: function() {
		if (this.$placeholder)
			this.$placeholder.remove();
		if(this.$el.html() == '&nbsp;')
			this.$el.html('');
	},
	preventDraggable: function(){
		//Prevent dragging from editable areas
		var draggable = this.$el.closest('.ui-draggable'),
			cancel = draggable.draggable('option', 'cancel')
		;
		if(_.isString(cancel) && cancel.indexOf('.ueditable') == -1){
			draggable.draggable('option', 'cancel', cancel + ',.ueditable');
		}
	},
	restoreDraggable: function(){
		var draggable = this.$el.closest('.ui-draggable'),
			cancel = draggable.draggable('option', 'cancel')
		;
		if(_.isString(cancel) && cancel.indexOf('.ueditable') != -1){
			draggable.draggable('option', 'cancel', cancel.replace(/,\.ueditable/g, ''));
		}
	},
	pluginList: function(options){
		var allPlugins = ['stateAlignmentCTA', 'stateAlignment', 'stateLists', 'blockquote', 'stateButtons', 'upfrontLink', 'upfrontColor', 'upfrontFormatting', 'upfrontIcons', 'upfrontSink', 'upfrontPlaceholder',  'panelButtons'],

			pluginList = []
		;
		$.each(allPlugins, function(i, name){
			if(typeof options[name] == 'undefined' || options[name])
				pluginList.push(name);
		});
		return pluginList;
	},
	listenForMouseUp: function(){
		var me = this;
		if(!me.redactor)
			me.redactor = me.$el.data('redactor');
		if(me.redactor)
			me.redactor.waitForMouseUp = true;

		$(document).one('mousedown', function(e) {
			if(!me.clickcount)
				me.clickcount = 0;
			me.clickcount = me.clickcount+1;
			me.lastmousedown = {x: e.pageX, y: e.pageY};
			if(me.clickcount > 0)
				setTimeout(function() { me.clickcount = 0 }, 400);
		});

		$(document).one('mouseup', function(e){
            if(!me.redactor)
                return;
			//var is_selection = ((Math.abs(e.pageX-me.lastmousedown.x) + Math.abs(e.pageY-me.lastmousedown.y)) > 2);
            var is_selection = !!me.redactor.selection.getText();

			if((is_selection || me.clickcount > 1) && me.redactor && me.redactor.waitForMouseUp && me.redactor.selection.getText()){
				me.redactor.airShow(e);
				me.redactor.$element.trigger('mouseup.redactor');
			}
			else
				$('.redactor_air').hide();

			if($(e.target).hasClass('uf_font_icon')) {
                // Todo Gagan: had to comment the following to allow the font icon to be selected, hope this doesn't brean anything
				//if(e.pageX < ($(e.target).offset().left + $(e.target).width()/2))
				//	me.redactor.caret.setBefore($(e.target));
				//else
				//	me.redactor.caret.setAfter($(e.target));
			}
		});

	},
	getValue: function(is_simple_element){
		var html = this.redactor.$element.html();
		if(this.insertManager)
			html = this.insertManager.insertExport(html, is_simple_element),
            $html =  $("<div>").html( html );

        $html.find(".redactor-selection-marker").remove();
        /**
         * Make sure the wrapping .plain-text-container is not being returned as html
         */
        return $.trim(
            // Conditionally nuke the wrapper - only if we actually have it
            $html.find(".plain-text-container").length
                ? $html.find(".plain-text-container").last().html()
                : $html.html()
        );
	},
	getInsertsData: function(){
		var insertsData = {};
		if(!this.insertManager)
			return {};

		_.each(this.insertManager._inserts, function(insert){
			insertsData[insert.data.id] = insert.data.toJSON();
		});

		return insertsData;
	},
	onCopy: function(e){
		var sel = window.getSelection(),
			self = this;
		self.font_icon = false;
		if(!_.isUndefined(  sel.anchorNode ) && sel.anchorNode.className === "uf_font_icon" ){
			var icon = document.createElement("span");
			icon.className = "uf_font_icon";
			icon.style.cssText = sel.anchorNode.style.cssText;
			var html = $.trim(sel.toString());
			html = html.replace(/\$/g, '&#36;');
			html = html.replace(/”/g, '"');
			html = html.replace(/“/g, '"');
			html = html.replace(/‘/g, '\'');
			html = html.replace(/’/g, '\'');

			icon.innerHTML = html;

			setTimeout( function(){
				if( self.redactor.$pasteBox === false ){
					self.redactor.paste.createPasteBox();
				}
				self.redactor.$pasteBox.html(icon);
				self.font_icon = icon.outerHTML;
			}, 1 );

		}
	}
};

var InsertManagerInserts = Backbone.View.extend({
    tpl: _.template($(tpl).find('#insert-manager-tooltip-tpl').html()),
    className: "ueditor-post-insert-manager",
    $block: false,
    initialize: function(options){
        this.insertsData = options.insertsData || {};
        this.inserts = options.inserts || {};
        this.redactor = options.redactor;
        this.onRemoveInsert = options.onRemoveInsert;
        this.listenTo( UeditorEvents, "ueditor:insert:relocate", this.insert_relocate );
				var me = this;
				this.listenTo( UeditorEvents, 'cleanUpListeners', function() {
					me.stopListening();
				});
    },
    events:{
        "click .uinsert-selector-option": "on_insert_click",
        "click .upfront-post-media-trigger": "toggle_inserts"
    },
    render: function(){
      this.$el.html( this.tpl( { inserts: _.pick(Inserts.inserts, this.inserts), names: Inserts.NAMES } ) );
    },
    insert_relocate: function( $current ){
      this.$block = $current;
    },
    toggle_inserts: function(e){
        e.preventDefault();
        e.stopPropagation();
        this.$el.find(".uinsert-selector").toggle();
    },
    on_insert_click: function( e ){
        e.preventDefault();
        e.stopPropagation();
        var type = $(e.target).data('insert'),
            insert = new Inserts.inserts[type](),
            self = this
            ;

        /**
         * Todo Sam: remove __insert and try to find why sometimes insert doesn't get found inside the done event
         */
        this.__insert = insert;
        insert.start( this.$el, this.redactor.$editor )
            .done(function(args, resolved_insert){

                /**
                 * Allows to get resolved insert from inserts with insert managers
                 */
                if(_.isArray(args) ){
                    var popup = args[0],
                        results = args[0],
                        insert = resolved_insert;
                }else{
                    var popup = args,
                        results = resolved_insert,
                        insert = insert || self.__insert
                    ;

                }

                // if(!results) Let's allow promises without result for now!
                //	return;
                self.inserts[insert.cid] = insert;
                //Allow to undo
                //this.trigger('insert:prechange'); // "this" is the embedded image object
                //self.trigger('insert:prechange'); // "self" is the view
                //Create the insert
                //insert.render();
                if( self.is_last_p() ){
					self.$block.before(insert.$el);
                }else{

                    if(self.redactor.$element.find(self.$block).length < 1) {
/*                        if(self.redactor.$element.hasClass('redactor-placeholder')) {
                    
                            var f = jQuery.Event("keydown");
                            f.which = 65;
                            f.keyCode = 65;// # Some key code value
                              
                            
                            
                            self.redactor.$element.trigger(f);

                        }
*/
                        self.redactor.$element.append(self.$block);  
                    }

                    self.$block.replaceWith(insert.$el);
				}

                self.$block.prev("br").remove();
                //self.trigger('insert:added', insert);
                self.insertsData[insert.data.id] = insert.data.toJSON();
                self.listenTo(insert.data, 'change add remove update', function(){
                    self.insertsData[insert.data.id] = insert.data.toJSON();
                });

                setTimeout(function(){
                    $(".uinsert-selector").hide();
                    $(".ueditor-post-insert-manager").hide();
                }, 100);

                self.redactor.code.sync();
                self.listenTo(insert, 'remove', self.onRemoveInsert);
            })
        ;
    },
	is_last_p: function(  ){
		var $ps = this.redactor.$element.find("p");
		return _.indexOf( $ps, this.$block[0] ) === ( $ps.length - 1 );
	}

});
var InsertManager = Backbone.View.extend({
    tpl: _.template($(tpl).find('#insert-manager-tpl').html()),
	initialize: function(opts){
		this.inserts = opts.inserts || {};
        this._inserts = {};
        this.ueditor = opts.ueditor;
		this.onRemoveInsert = _.bind(this.removeInsert, this);
		this.insertsData = opts.insertsData || {};
		this.deletedInserts = {};
		this.$el.children().addClass('nosortable');
		this.insertLookUp();
		this.bindTriggerEvents();
		this.refreshTimeout = false;
		this.sortableInserts();
		this.render_tooltips();

		if( opts.ueditor.options.inserts ){
			this.listenTo( UeditorEvents, "ueditor:click", this.position_tooltips );
			this.listenTo( UeditorEvents, "ueditor:key:up", this.position_tooltips );
		}
		var me = this;
		this.listenTo( UeditorEvents, 'cleanUpListeners', function() {
			me.stopListening();
		});
	},
    render_tooltips: function(){
        if( !this.ueditor.options.inserts ||  this.ueditor.options.inserts.length === 0 ) return;

        var self = this,
            tooltips = new InsertManagerInserts({
            insertsData: this.insertsData,
            inserts: this.inserts,
            redactor: this.ueditor.redactor,
            onRemoveInsert: this.onRemoveInsert
        });
        tooltips.render();
        this.ueditor.$el.after( tooltips.$el );
        this.$tooltips = tooltips.$el;
    },
    position_tooltips: function(redactor){
        if( !this.$tooltips ) return;

        var $current = $( redactor.selection.getCurrent());
        if( this.show_tooltip_in_this_location( redactor ) ){
			if( typeof $current[0] === "undefined" || !_.isElement($current[0]) ) return;
            var css = _.extend( $current.position(), { marginLeft: _.isArray($current) && _.isElement($current[0]) ?   $current.css("padding-left") : 0 } );
            this.$tooltips.css( css );
            this.$tooltips.show();
            UeditorEvents.trigger("ueditor:insert:relocate", $current);
        }else{
            this.$tooltips.hide();
        }
    },
	bindTriggerEvents: function (redactor) {
		var me = this,
			parent = this.$el.parent(),
			root_offset = this.$el.offset(),
			updateTrigger = $.proxy(this.updateMediaTriggerPosition, this),
			onMousemove = function(e){
				if($(e.target).parent()[0] != me.$el[0] || !me.currentBlock)
					return;

				if(!this.ticking){
					Upfront.Util.requestAnimationFrame(updateTrigger);
					ticking = true;
				}
				var height = me.currentBlock.height(),
					position = e.offsetY / height
				;

				me.triggerPosition = height > 60 ? position : Math.round(position);
			},
			onMouseenter = function(e){
				if($(e.target).parent()[0] != me.$el[0])
					return;
				me.currentBlock = $(e.currentTarget);
			},
			onMouseleave = function(e){
				if($(e.target).parent()[0] != me.$el[0] || !me.currentBlock)
					return;

				me.lastBlock = me.currentBlock;
				if(me.currentBlock[0] == e.currentTarget){
					me.currentBlock = false;
					me.mediaTrigger.removeClass('upfront-post-media-trigger-visible');
				}
			},
			bindMouseEvents = function(){
				me.$el
					.on('mousemove', 'p,div:not(.ueditor-insert),ul,ol', onMousemove)
					.on('mouseenter', 'p,div:not(.ueditor-insert),ul,ol', onMouseenter)
					.on('mouseleave', 'p,div:not(.ueditor-insert),ul,ol', onMouseleave)
				;
			}
		;
		var ed = this.$el.data("ueditor");
		// Since callback was commented out, I [Ivan] ditched this whole if statement.
		// If it's ever re-enabled than it needs to clean up after itself i.e.
		// remove 'on' listener for 'ueditor:stop', otherwise it causes Redactor node leak
		// if (ed && ed.redactor) {
			// ed.redactor.events.on("ueditor:stop", function () {
				// //me.currentBlock = me.lastBlock = false;
			// });
		// }

		this.ticking = false;

		//Left marker used to place the trigger correctly when
		// there is an isert floated to the left
		this.leftMarker = $('<span style="float:left">');

		//bindMouseEvents();


	},

	updateMediaTriggerPosition: function(){
		var marginLeft,
			leftMarker = this.leftMarker
		;
		if(this.currentBlock){
			if(this.triggerPosition > 0.7){
				this.currentBlock.append(leftMarker);
				marginLeft = leftMarker.offset().left - this.currentBlock.offset().left;
				leftMarker.detach();
				this.mediaTrigger
					.addClass('upfront-post-media-trigger-visible upfront-post-media-trigger')
					.data('insert', 'after')
					.css({top: this.currentBlock.position().top + this.currentBlock.height(), 'margin-left': marginLeft + 'px'});
			}
			else if(this.triggerPosition < 0.3){
				this.currentBlock.prepend(leftMarker);
				marginLeft = leftMarker.offset().left - this.currentBlock.offset().left;
				leftMarker.detach();
				this.mediaTrigger
					.addClass('upfront-post-media-trigger-visible upfront-post-media-trigger')
					.data('insert', 'before')
					.css({top: this.currentBlock.position().top, display: 'block', 'margin-left': marginLeft + 'px'});
			}
			else
				this.mediaTrigger.removeClass('upfront-post-media-trigger-visible');
		}
	},

	insertLookUp: function(){
		var me = this,
			insertsData = _.extend({}, me.insertsData, me.deletedInserts)
		;

		_.each(_.pick(Inserts.inserts, this.inserts), function(Insert){
			_.extend(me._inserts, Insert.prototype.importInserts(me.$el, insertsData, me.inserts));
		});

		_.each(me._inserts, function(insert){
			me.insertsData[insert.data.id] = insert.data.toJSON();

			// Listen to the inserts model to update the data on any change
			me.stopListening(insert.data);
			me.listenTo(insert.data, 'change add remove update', function(){
				if(me.insertsData[insert.data.id])
					me.insertsData[insert.data.id] = insert.data.toJSON();
			});

			me.listenTo(insert, 'remove', me.onRemoveInsert);
		});

		//Force first sync
		this.trigger('insert:added');
	},

	removeInsert: function(insert){
		this.trigger('insert:prechange');
		insert.$el.detach();
		this.trigger('insert:removed');
	},

	insertExport: function(html, is_simple_element){
		var $html = $('<div>').html(html);
		$html.find('.nosortable').removeClass('nosortable');
		_.each(this._inserts, function(insert){
			var elementId = '#' + insert.data.id,
				out = is_simple_element ? insert.getSimpleOutput() : insert.getOutput()
			;
			$html.find(elementId).replaceWith(out);
		});
		return $html.html();
	},

	parseMarkup: function(){
		var me = this;
		if(this.refreshTimeout)
			clearTimeout(this.refreshTimeout);

		this.refreshTimeout = setTimeout(function(){
			_.each(me.deletedInserts, function(insert, id){
				var element = me.$el.find('#' + id);
				if(element.length){
					me._inserts[id] = insert;
					delete me.deletedInserts[id];/*

					//We need to re-create the controls in order to make them work again
					element.replaceWith(insert.el);
					insert.createControls();
					if(insert.controls)
						insert.$el.append(insert.controls.el);
					insert.delegateEvents();*/
				}
			});
			_.each(me._inserts, function(insert, id){
				if(!insert.$el.parent().length){
					var element = me.$el.find('#' + id);
					if(element.length){
						element.replaceWith(insert.el);
						insert.delegateEvents();
						insert.controls.delegateEvents();
						if(insert.controlEvents)
							insert.controlEvents();
					}
					else{
						me.deletedInserts[id] = insert;
						delete me._inserts[id];
					}
				}
			});
			me.$el.children(':not(.ueditor-insert), :not(.ueditor-post-insert-manager)').addClass('nosortable');
		}, 600);
	},

	sortableInserts: function(){
		var me = this;
		me.$el.sortable({cancel: '.nosortable', helper: 'clone', handle: '.uinsert-drag-handle'})
			.on('sortstart', function(e, ui){
				console.log('Sort start');
				ui.placeholder.width(ui.helper.width());
				if(ui.item.css('float') != 'none')
					ui.helper.css({marginTop: e.offsetY});
			});
	},
	show_tooltip_in_this_location: function(redactor){
		var $block = $( redactor.selection.getCurrent());

		if(_.isEmpty( $block ) ) return false;

		var $image_embed_insert_wrappers = $(".upfront-inserted_image-wrapper, .upfront-inserted_embed-wrapper"),
			block_top = $block.offset().top,
			show_tooltip = true;
		$image_embed_insert_wrappers.each(function(){
			var $this = $(this),
				height = $this.find(".ueditor-insert-variant-group").height(),
				top = $this.offset().top;
			if( block_top <= ( height + top + 20) && block_top >= ( top - 5)  ){
				show_tooltip = false;
			}
		});

		return 	show_tooltip
				&& 	$block.closest(".ueditor-insert").length === 0
				&&  ( $.trim( $block.html() ) === "<br>" || ( typeof $block.closest("p.nosortable").html() !== "undefined" &&  $.trim( $block.closest("p.nosortable").html() ) === "" ) ) ;
	}
});

var ImagesHelper = {
	Image: {
		redactor: false,
		selector: ".upfront-inserted_image-wrapper",
		bind_events: function () {
			this.unbind_events();
			this.redactor.$editor
				.on("mouseover", this.selector, this, this.hover_on)
				.on("mouseout", this.selector, this, this.hover_off)

				.on("mouseenter", ":not(" + this.selector + ")", this, this.hover_off)
			;
		},
		unbind_events: function () {
			this.redactor.$editor
				.off("mouseover", this.selector, this.hover_on)
				.off("mouseout", this.selector, this.hover_off)

				.off("mouseenter", ":not(" + this.selector + ")", this, this.hover_off)
			;
			this.remove_dialog();
		},
		hover_on: function (e) {
			var $me = $(e.target),
				$dialog = $("#upfront-image-details")
			;
			if (!$me.is(e.data.selector)) $me = $me.closest(e.data.selector);
			if (!$me.find('img').length) return;

			e.data.show_dialog($me);

			Upfront.Events.trigger("upfront:editor:image_on", $me.get());
		},
		hover_off: function (e) {
			var $me = $(e.target);
				$isParent = $(e.toElement).closest("#upfront-image-details")
			;
			if (!$isParent.length) e.data.remove_dialog();
		},
		create_dialog: function () {
			if ( $("#upfront-image-details").length ) return;
			var $dialog = $("<div id='upfront-image-details' class='upfront-ui' />");
			$dialog.append(
				'<div class="upfront-image-orientation">' +
					'<div class="upfront-image-align-left upfront-icon upfront-icon-image-left">left</div>' +
					'<div class="upfront-image-align-center upfront-icon upfront-icon-image-center">center</div>' +
					'<div class="upfront-image-align-right upfront-icon upfront-icon-image-right">right</div>' +
					'<div class="upfront-image-align-full upfront-icon upfront-icon-image-full">full width</div>' +
				'</div>' +
				'<div class="upfront-image-actions">' +
					'<div class="upfront-image-action-change upfront-icon upfront-icon-image-select">Change Image</div>' +
					'<div class="upfront-image-action-details upfront-icon upfront-icon-image-detail">Image Details</div>' +
				'</div>' +
				'<div class="upfront-image-delete upfront-icon-button upfront-icon-button-delete"></div>'
			);
			$('body').append($dialog);
			$dialog
				.find(".upfront-image-align-left").on("click", this, this.Align.left).end()
				.find(".upfront-image-align-center").on("click", this, this.Align.center).end()
				.find(".upfront-image-align-right").on("click", this, this.Align.right).end()
				.find(".upfront-image-align-full").on("click", this, this.Align.full).end()

				.find(".upfront-image-action-change").on("click", this, this.change_image).end()
				.find(".upfront-image-action-details").on("click", this, this.Details.toggle).end()

				.find(".upfront-image-delete").on("click", this, this.delete_image).end()
			;
			$dialog.hide();
		},
		remove_dialog: function (force, del) {
			var $dialog = $("#upfront-image-details"),
				$details = $("#upfront-image-details-image_details")
			;
			if (!$details.length){
				$dialog.hide();
				$('#upfront-inline-slider-nav').hide();
			}
			else if (force) {
				$details.remove();
				$dialog.hide();
			}
			if (force && del)
				$dialog.remove();
		},
		show_dialog: function ($wrap) {
			var $dialog = $("#upfront-image-details");
			$dialog.data('ref', $wrap.get(0));
			if ( $wrap.hasClass('upfront-inserted_image-slider') || $wrap.hasClass('upfront-inserted_image-gallery') )
				$dialog.addClass('no-orientation');
			else
				$dialog.removeClass('no-orientation');

			var off = $wrap.offset(),
				height = $wrap.outerHeight(),
				width = $wrap.outerWidth(),
				dialog_height = $dialog.outerHeight();

			$dialog.css({
				top: off.top + ( dialog_height > height ? 0 : height-dialog_height ),
				left: off.left,
				width: width
			});
			$dialog.show();
		},
		get_target: function (target){
			return $($(target).closest("#upfront-image-details").data('ref'));
		},
		change_image: function (e) {
			var $img = e.data.get_target(e.target);
			Upfront.Media.Manager.open({
				multiple_selection: false,
				button_text: "Change image"
			}).done(function (popup, result) {
				if (!result) return false;
				if (!result.length) return false;
				var html = Upfront.Media.Manager.results_html(result);
				$img.replaceWith(html);
				e.data.redactor.code.sync();
				e.data.bind_events();
			});
			return false;
		},
		delete_image: function (e) {
			var $img = e.data.get_target(e.target),
				$wrapper = $img.parent(),
				is_on_slider = $wrapper.hasClass('upfront-inline_post-slider'),
				is_on_gallery = $wrapper.hasClass('upfront-inline_post-gallery');
			if ( ( is_on_slider || is_on_gallery ) && $wrapper.find('img') == 1 )
				$wrapper.remove();
			else
				$img.remove();
			if ( is_on_slider )
				Slider.reset_nav($wrapper);
			e.data.redactor.code.sync();
			e.data.redactor.focus();
			return false;
		},
		Align: {
			_apply: function ($img, data) {
				data = $.extend({
					float: "",
					"text-align": "",
					"width": ""
				}, data);
				$img.css(data);
			},
			left: function (e) {
				var $wrap = e.data.get_target(e.target),
					$img = $wrap.find('img');
				e.data.Align._apply($wrap, {float: "left"});
				e.data.Align._apply($img, {});
				e.data.show_dialog($wrap);
				Upfront.Events.trigger("upfront:editor:image_align", $wrap.get(), 'left');
				e.data.redactor.code.sync();
				return false;
			},
			center: function (e) {
				var $wrap = e.data.get_target(e.target),
					$img = $wrap.find('img');
				e.data.Align._apply($wrap, {
					"text-align": "center"
				});
				e.data.Align._apply($img, {});
				e.data.show_dialog($wrap);
				Upfront.Events.trigger("upfront:editor:image_align", $wrap.get(), 'center');
				e.data.redactor.code.sync();
				return false;
			},
			right: function (e) {
				var $wrap = e.data.get_target(e.target),
					$img = $wrap.find('img');
				e.data.Align._apply($wrap, {float: "right"});
				e.data.Align._apply($img, {});
				e.data.show_dialog($wrap);
				Upfront.Events.trigger("upfront:editor:image_align", $wrap.get(), 'right');
				e.data.redactor.code.sync();
				return false;
			},
			full: function (e) {
				var $wrap = e.data.get_target(e.target),
					$img = $wrap.find('img');
				e.data.Align._apply($wrap, {});
				//e.data.Align._apply($img, {width: "100%"});
				e.data.show_dialog($wrap);
				Upfront.Events.trigger("upfront:editor:image_align", $wrap.get(), 'full');
				e.data.redactor.code.sync();
				return false;
			}
		},
		Details: {
			toggle: function (e) {
				var $dialog = $("#upfront-image-details"),
					$details = $("#upfront-image-details-image_details")
				;
				if ($details.length) e.data.Details.close(e);
				else e.data.Details.open(e);
				return false;
			},
			open: function (e) {
				var $wrapper = e.data.get_target(e.target),
					$img = $wrapper.find("img"),
					$dialog = $("#upfront-image-details"),
					$button = $dialog.find('.upfront-image-action-details'),
					$details = $('<div id="upfront-image-details-image_details" />'),
				// Gather data for form preset population
					$link = $wrapper.find("a"),
					no_link = !$link.length ? 'checked="checked"' : '',
					popup_link = $link.length && $link.is(".popup") ? 'checked="checked"' : '',
					link_link = $link.length && $link.attr("href").match(/^[^#]+/) ? 'checked="checked"' : '',
					link_value = $link.length && !!link_link ? $link.attr("href") : ''
				;
				$details.append(
					'<div class="upfront-image-detail-alt">' +
						'<label class="upfront-field-label">Image Details:</label>' +
						'<input class="upfront-field upfront-field-text" type="text" placeholder="Alt" value="' + $img.attr("alt") + '" />' +
					'</div>' +
					'<div class="upfront-image-detail-link">' +
						'<label class="upfront-field-label">Image links to:</label>' +
						'<ul>' +
							'<li><label><input class="upfront-field-radio" type="radio" ' + no_link + ' name="link_to" value="" /> No link</label></li>' +
							'<li><label><input class="upfront-field-radio" type="radio" ' + popup_link + ' name="link_to" value="popup" /> Larger version (opens in lightbox)</label></li>' +
							'<li><label><input class="upfront-field-radio" type="radio" ' + link_link + ' name="link_to" value="link" /> Link <input class="upfront-field upfront-field-text" type="text" placeholder="http://www.google.com" value="' + link_value + '" /></label></li>' +
							'<li><label><input class="upfront-field-radio" type="radio" name="link_to" value="post" /> Post or page <em>/your-cool-post/</em></label></li>' +
						'</ul>' +
					'</div>' +
					'<button class="upfront-image-detail-button" type="button">OK</button>'
				);
				/*$details.on('focus', '.upfront-image-detail-link li :text', function(e){
					$(this).siblings(':radio').prop('checked', true);
				});*/
				$details.css({
					position: "absolute",
					top: $button.offset().top + $button.height(),
					"z-index": 99
				});
				$("body").append($details);
				$details.css({
					left: $button.offset().left + 46 - ($details.width()/2),
				});
				$button.addClass('upfront-image-action-details-active');

				$details.on("click", "button", e.data, e.data.Details.apply_details);
			},
			close: function (e) {
				var $dialog = $("#upfront-image-details"),
					$button = $dialog.find('.upfront-image-action-details'),
					$details = $("#upfront-image-details-image_details");
				$button.removeClass('upfront-image-action-details-active');
				$details.remove();
			},
			apply_details: function (e) {
				var $dialog = $("#upfront-image-details"),
					$details = $("#upfront-image-details-image_details"),
					$wrapper = $($dialog.data('ref')),
					$img = $wrapper.find("img"),
					$old_link = $wrapper.find("a"),
				// Data changes to apply
					alt = $details.find(".upfront-image-detail-alt :text").val(),
					link_to = $details.find(".upfront-image-detail-link :radio:checked").val(),
					link_url = $details.find(".upfront-image-detail-link :text").val()
				;

				$img.attr("alt", alt);

				if (link_to) {
					var $link = $old_link.length ? $old_link : $('<a href="#" />');
					switch (link_to) {
						case "popup":
							$link.addClass("popup");
							break;
						case "link":
							$link.attr("href", link_url);
							break;
						case "post":
							$link.attr("href", 'http://localhost/upfront/edit/post/8');
							break;
					}
					if (!$old_link.length) $img.wrapAll($link);
				} else if ($old_link.length) {
					$old_link.replaceWith($img);
				}
				e.data.redactor.code.sync();
				return e.data.Details.close(e);
			}
		},
		cleanup: function (content) {
			var $cnt = $("<div />").append(content);
			$cnt.find("#upfront-image-details").remove();
			return $cnt.html();
		}
	},
	Gallery: {
		to_html: function (redactor) {
			var content = redactor.$editor.html(),
				edited = content.replace(
					/\[upfront-gallery\](.*?)\[\/upfront-gallery\]/,
					'<div class="upfront-inline_post-gallery clearfix">$1</div>'
				)
			;
			redactor.$editor.html(edited);
			redactor.code.sync();
		},
		from_html: function (content) {
			var $c = $("<div />").append(content),
				$repl = $c.find(".upfront-inline_post-gallery")
			;
			if (!$repl.length) return content;

			$repl.each(function () {
				var $me = $(this),
					gallery = ''
				;
				gallery = $me.html();
				$me.replaceWith('[upfront-gallery]' + gallery + '[/upfront-gallery]');
			});
			return $c.html();
		}
	},
	Slider: {
		to_html: function (redactor) {
			var content = redactor.$editor.html(),
				edited = content.replace(
					/\[upfront-slider\](.*?)\[\/upfront-slider\]/,
					'<div class="upfront-inline_post-slider clearfix">$1</div>'
				)
			;
			redactor.$editor.html(edited);
			redactor.code.sync();
			this.init_sliders_edit(redactor);
		},
		init_sliders_edit: function (redactor) {
			var $sliders = redactor.$editor.find('.upfront-inline_post-slider'),
				$slider_nav = $('<div id="upfront-inline-slider-nav" class="upfront-default-slider-nav upfront-ui" />');
			$('body').append($slider_nav);
			$sliders.each(function(){
				var $slider = $(this),
					$items = $slider.find('.upfront-inserted_image-wrapper'),
					max_height = 0;
				calc_height();
				$slider.find('img').on('load', calc_height);
				function calc_height () {
					$slider.css('height', 9999);
					$items.each(function(index){
						var $img = $(this).find('img'),
							img_h = $img.height();
						max_height = max_height > img_h ? max_height : img_h;
					});
					$slider.css('height', Math.ceil(max_height/15)*15);
					redactor.code.sync();
				}
			});
			$(document)
				.on('mouseenter', '.upfront-inline_post-slider', this, this.hover_on)
				.on('mouseleave', '.upfront-inline_post-slider', this, this.hover_off)
			;
			$slider_nav.on('click', '.upfront-default-slider-nav-item', this, this.slide_switch);
		},
		hover_on: function (e) {
			var $slider = $(this),
				$slider_nav = $('#upfront-inline-slider-nav'),
				off = $slider.offset(),
				height = $slider.outerHeight(),
				width = $slider.outerWidth(),
				me = e.data;
			$slider_nav.css({
				top: off.top + height,
				left: off.left,
				width: width
			});
			$slider_nav.show();
			if ( me.$current_slider && me.$current_slider.get(0) == $slider.get(0) )
				return;
			me.$current_slider = $slider;
			me.reset_nav($slider);
		},
		hover_off: function (e) {

		},
		slide_switch: function (e) {
			var $nav_item = $(this),
				nav_index = $nav_item.attr('data-slider-index'),
				$slider_nav  = $('#upfront-inline-slider-nav'),
				me = e.data;
			me.$current_slider.find('.slide-edit-active').removeClass('slide-edit-active');
			me.$current_slider.find('.upfront-inserted_image-wrapper').eq(nav_index).addClass('slide-edit-active');
			$slider_nav.find('.upfront-default-slider-nav-item-selected').removeClass('upfront-default-slider-nav-item-selected');
			$nav_item.addClass('upfront-default-slider-nav-item-selected');
			ImagesHelper.Image.remove_dialog();
			$slider_nav.show();
		},
		reset_nav: function ($slider) {
			var $slider_nav  = $('#upfront-inline-slider-nav');
			$slider_nav.html('');
			$slider.find('.upfront-inserted_image-wrapper').each(function(index){
				$slider_nav.append('<i class="upfront-default-slider-nav-item" data-slider-index="' + index + '">' + index + '</i>');
			});
			$slider_nav.find('.upfront-default-slider-nav-item:first').trigger('click');
		},
		from_html: function (content) {
			var $c = $("<div />").append(content),
				$repl = $c.find(".upfront-inline_post-slider")
			;
			if (!$repl.length) return content;

			$repl.each(function () {
				var $me = $(this),
					slider = ''
				;
				slider = $me.html();
				$me.replaceWith('[upfront-slider]' + slider + '[/upfront-slider]');
			});
			return $c.html();
		}
	}
};



}); //End require

}(jQuery));
