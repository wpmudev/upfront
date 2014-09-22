;(function($){

var deps = [
	'text!scripts/redactor/ueditor-templates.html',
	'scripts/redactor/ueditor-inserts'
];

define("ueditor", deps, function(tpl, Inserts){
var hackedRedactor = false;

var UeditorEvents = _.extend({}, Backbone.Events);

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
				Ueditor.prototype.redactorInitialized = true;
			}
		}
	});

	if ( this.length == 1 && typeof result != 'undefined' )
		return result;
	return this;
};

var hackRedactor = function(){
	//Prevent Redactor code cleanup on init and early start of plugins
	$.Redactor.prototype.buildEnable = function(){
		// Start plugins here, before options are handled so we can modify them
		if(!this.pluginsBuilt){
			var me = this;
			if (!this.opts.plugins )
				this.opts.plugins = [];

			this.pluginsBuilt = [];

			$.each(this.opts.plugins, function(idx, name){
				var plugin = RedactorPlugins[name];
				if(plugin){
					me.pluginsBuilt.push(plugin);
					$.extend(me, plugin);
					if($.isFunction(plugin.beforeInit))
						me.beforeInit();
				}
			});
		}

		//Redactor.buildEnable
		this.$editor.addClass('redactor_editor').attr({ 'contenteditable': true, 'dir': this.opts.direction });
		this.$source.attr('dir', this.opts.direction).hide();

		// set strip to false to prevent code cleaning
		this.set(this.content, false, false);
	};

	// Let Ctrl/Cmd+A (yeah...) work normally
	$.Redactor.prototype.airEnable = function () {
			if (!this.opts.air || !this.opts.airButtons) return;
			var _cmd_keys = [224, 17, 91, 93]; // Yay for Mac OS X

			this.$editor.on('mouseup.redactor keyup.redactor', this, $.proxy(function(e) {
				var insert = $(e.target).closest('.ueditor-insert');
				if(insert.length && insert.closest(this.$box).length)
					return;

				var text = this.getSelectionText();
				this.opts.toolbarFixedTopOffset = "50";
				if (e.type === 'mouseup' && text != '') this.airShow(e);
				if (e.type === 'keyup' && e.shiftKey && text != '') {
					var $focusElem = $(this.getElement(this.getSelection().focusNode)), offset = $focusElem.offset();
					offset.height = $focusElem.height();
					this.airShow(offset, true);
				}
				// Additional ctrl/cmd stuffs
				if ('keyup' === e.type && e.ctrlKey && '' != text) this.airShow(e); // Ctrl
				if ('keyup' === e.type && _cmd_keys.indexOf(e.which) > 0 && '' != text) this.airShow(e); // Cmd (?)
				/**
				 * If redactor is to high for the user to see it, show it under the selected text
				 */
				if( this.$air.offset().top < 0 ){
					this.$air.css({
						top : e.clientY + 14 + this.$box.position().top + "px"
					});
					this.$air.addClass("under");
				}else{
					this.$air.removeClass("under");
				}
			}, this));
	};

	// We already have all the plugins' methods in redactor, just call init
	$.Redactor.prototype.buildPlugins = function() {
		var me = this;

		$.each(this.pluginsBuilt, function(idx, plugin){
			if($.isFunction(plugin.init)){
				var init = $.proxy(plugin.init, me);
				init();
			}
		});
	};


	
	// Make click consistent
	$.Redactor.prototype.airBindHide = function () {
		if (!this.opts.air) return;


		var hideHandler = $.proxy(function(doc) {
			$(doc).on('mouseup.redactor', $.proxy(function (e) {
				if ($(e.target).closest(this.$toolbar).length === 0) {
					if (!this.getSelectionText()) {
						this.$air.fadeOut(100);
						$(".redactor_dropdown").hide();
						this.$toolbar.find(".dropact").removeClass("dropact");
						$(doc).off(e);
					}
				}
			}, this)).on('keydown.redactor', $.proxy(function (e) {
				if (e.which === this.keyCode.ESC) {
					this.getSelection().collapseToStart();
				}
				this.$air.fadeOut(100);
				$(doc).off(e);
			}, this));
		}, this);

		// Hide the toolbar at events in all documents (iframe)
		hideHandler(document);
		if (this.opts.iframe) hideHandler(this.document);
	};

	//Fix the selection, making the temporary markers not interfere with the style selection for the buttons.
	// $.Redactor.prototype.selectionSet = function(orgn, orgo, focn, foco) {
	// 	if (focn === null) focn = orgn;
	// 	if (foco === null) foco = orgo;

	// 	var sel = this.getSelection();
	// 	if (!sel) return;

	// 	var range = this.getRange();

	// 	if(focn != orgn && orgn.id == 'selection-marker-1'){
	// 		orgn = orgn.nextSibling;
	// 		orgo = 0;
	// 		focn = focn.previousSibling;
	// 		foco = ( !_.isEmpty(focn) && !_.isUndefined( focn.length ) ) 
	// 				? focn.length : 
	// 					( !_.isEmpty(focn) && !_.isUndefined( focn.innerText ) ) ? focn.innerText.length - 1 : 0;

	// 	}


	// 	try {
	// 		range.setStart(orgn, orgo);
	// 		range.setEnd(focn, foco );
	// 		sel.removeAllRanges();
	// 	} catch (e) {}

	// 	sel.addRange(range);
	// };

	//Change the position of the air toolbar
	$.Redactor.prototype.airShow = function (e, keyboard)
		{
			if (!this.opts.air || !this.opts.airButtons.length) return;

			$('.redactor_air').hide();

			// this.selectionRemoveMarkers();
			this.selectionSave();

			var width = this.airWidth || this.$air.width(),
				m1 = this.$editor.find('#selection-marker-1').offset(),
				m2 = this.$editor.find('#selection-marker-2').offset(),
				bounds = m2.top < m1.top ? {top: m2.top - 55, left: m2.left, right: m1.left, i:2} : {top: m1.top - 55, left: m1.left, right: m2.left, i:1},
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

			this.selectionRemoveMarkers();

			this.$air.css({
				left: bounds.left  + 'px',
				top: bounds.top + 'px'
			}).show();

			this.airBindHide();
			this.$air.trigger('show');
		};

	// Add possiblity to disable linebreak (for one line title)
	$.Redactor.prototype.doInsertLineBreak = $.Redactor.prototype.insertLineBreak;
	$.Redactor.prototype.insertLineBreak = function()
	{
		if ( !this.opts.disableLineBreak )
			return this.doInsertLineBreak();
		return false;
	};

/*
	$.Redactor.prototype.getCurrent = function(){
		var el = false;
		var sel = this.getSelection();

		if (sel.rangeCount > 0) el = sel.getRangeAt(0).startContainer;

		if(el.nodeType === 3) //If we got a text node, get parent
			el = el.parentNode;

		return this.isParentRedactor(el);
	};
*/



	hackedRedactor = true;

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
};

var Ueditor = function($el, options) {
	//Allow user disable plugins
	var plugins = this.pluginList(options);

	this.$el = $el;
	this.options = $.extend({
			// Ueditor options
			autostart: true, //If false ueditor start on dblclick and stops on blur
			startoninit: true,
			stateButtons: {},

			// Redactor options
			air:true,
			linebreaks: true,
			disableLineBreak: false,
			focus: true,
			cleanup: false,
			plugins: plugins,
			airButtons: ['upfrontFormatting', 'bold', 'italic', 'blockquote', 'upfrontLink', 'stateLists', 'stateAlign', 'upfrontColor', 'upftonIcons'],
			buttonsCustom: {},
			activeButtonsAdd: {},
			observeLinks: false,
			observeImages: false,
			formattingTags: ['h1', 'h2', 'h3', 'h4', 'p', 'pre'],
			inserts: false,
		}, options)
	;

	/* --- Redactor allows for single callbacks - let's dispatch events instead --- */
	this.options.dropdownShowCallback = function () { UeditorEvents.trigger("ueditor:dropdownShow", this); };
	this.options.dropdownHideCallback = function () { UeditorEvents.trigger("ueditor:dropdownHide", this); };
	this.options.initCallback = function () { UeditorEvents.trigger("ueditor:init", this); };
	this.options.enterCallback = function () { UeditorEvents.trigger("ueditor:enter", this); };
	this.options.changeCallback = function () { UeditorEvents.trigger("ueditor:change", this); };
	this.options.pasteBeforeCallback = function () { UeditorEvents.trigger("ueditor:paste:before", this); };
	this.options.pasteAfterCallback = function () { UeditorEvents.trigger("ueditor:paste:after", this); };
	this.options.focusCallback = function () { UeditorEvents.trigger("ueditor:focus", this); };
	this.options.blurCallback = function () { UeditorEvents.trigger("ueditor:blur", this); };
	this.options.keyupCallback = function (e) { UeditorEvents.trigger("ueditor:key:up", this); };
	this.options.keydownCallback = function (e) { UeditorEvents.trigger("ueditor:key:down", this, e); };
	this.options.textareaKeydownCallback = function () { UeditorEvents.trigger("ueditor:key:down:textarea", this); };
	this.options.syncBeforeCallback = function (html) { UeditorEvents.trigger("ueditor:sync:before", this, html); return html; }; // <-- OOOH this one is different
	this.options.syncAfterCallback = function (html) { UeditorEvents.trigger("ueditor:sync:after", this, html); $el.trigger('syncAfter', html); }; //Added syncAfter for east saving.
	this.options.autosaveCallback = function () { UeditorEvents.trigger("ueditor:autosave", this); };
	this.options.execCommandCallback = function (cmd, param) { UeditorEvents.trigger("ueditor:exec:" + cmd, this, param); }; // Do we need this? Yes, restore inserts on undo
	// Also available ueditor events (not redactor callbacks:
		// ueditor:start
		// ueditor:stop
		// ueditor:method:<method>

	this.id = 'ueditor' + (Math.random() * 10000);

	if(this.options.autostart){
		if(this.options.startoninit)
			this.start();
	}
	else {
		this.bindStartEvents();
		this.startPlaceholder();
	}

};

Ueditor.prototype = {
	disableStop: false,
	mouseupListener: false,

	start: function(){
		this.stopPlaceholder();
		this.$el.addClass('ueditable')
			.removeClass('ueditable-inactive')
			.attr('title', '')
			.redactor(this.options)
		;
		this.$el.trigger('start', this);
		this.redactor = this.$el.data('redactor');
		this.redactor.ueditor = this;
		this.preventDraggable();
		this.redactor.selectionRemoveMarkers();
		UeditorEvents.trigger('ueditor:start', this.redactor);

		if(!Upfront.data.Ueditor)
			Upfront.data.Ueditor = {instances: {}};
		Upfront.data.Ueditor.instances[this.id] = this;

		//Open the toolbar when releasing selection outside the element
		this.mouseupListener = $.proxy(this.listenForMouseUp, this);
		this.$el.on('mousedown', this.mouseupListener);

		if(this.options.inserts){
			this.insertsSetUp();
		}

		//Listen for outer clicks to stop the editor if necessary
		if(!this.options.autostart)
			this.listenToOuterClick();

	},
	stop: function(){
		if(this.redactor){
			UeditorEvents.trigger('ueditor:stop', this.redactor);
			this.$el.trigger('stop');
			this.restoreDraggable();
			this.$el.removeClass('ueditable');
			this.redactor.destroy();
			this.redactor = false;
		}
		if ("undefined" !== typeof Upfront.data.Ueditor) delete Upfront.data.Ueditor.instances[this.id];
		this.startPlaceholder();
		$(document).off('click', this.checkInnerClick);
	},

	bindStartEvents: function() {
		var me = this;

		me.$el.addClass('ueditable-inactive')
			.attr('title', 'Double click to edit the text')
			.one('dblclick', function(e){
				//e.preventDefault();
				//e.stopPropagation();
				if(!me.redactor)
					me.start(e);
			})
		;
	},

	insertsSetUp: function(){
		var me = this,
			manager = new InsertManager({el: this.$el, insertsData: this.options.inserts}),
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
			var selection = me.redactor.getSelection();
			me.redactor.bufferSet();
		})
		manager.on('insert:added insert:removed', function(){
			me.redactor.sync();
			me.redactor.events.trigger("ueditor:insert:media");
		});
	},

	listenToOuterClick: function(){
		var me = this;
		if(!this.checkInnerClick){
			this.checkInnerClick = function(e){
				//Check we are not selecting text
				var selection = document.getSelection ? document.getSelection() : document.selection;
				if(selection && selection.type == 'Range')
					return;

				//Check if the click has been inner, or inthe popup, otherwise stop the editor
				if(!me.options.autostart && me.redactor){
					var $target = $(e.target);
					if(!me.disableStop && !$target.closest('.redactor_air').length && !$target.closest('.ueditable').length){
						me.stop();
						me.bindStartEvents();
					}
				}
			};
		}
		$(document).on('click', this.checkInnerClick);
	},

	callMethod: function(method){
		var result = this.$el.redactor(method);
		UeditorEvents.trigger("ueditor:method:" + method, this.$el.redactor);
		return result;
	},
	startPlaceholder: function(){
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
		}
	},
	stopPlaceholder: function() {
		console.log('stop placeholder');
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
		var allPlugins = ['stateAlignment', 'stateLists', 'blockquote', 'stateButtons', 'upfrontLink', 'upfrontColor', 'panelButtons', /* 'upfrontMedia', 'upfrontImages', */'upfrontFormatting', 'upfrontSink', 'upfrontPlaceholder', 'upftonIcons'],
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
		$(document).one('mouseup', function(e){
			if(me.redactor && me.redactor.waitForMouseUp && me.redactor.getSelectionText()){
				me.redactor.airShow(e);
				me.redactor.$element.trigger('mouseup.redactor');
			}
		});
	},
	getValue: function(is_simple_element){
		this.redactor.sync();
		var html = this.redactor.$source.val();
		if(this.insertManager)
			html = this.insertManager.insertExport(html, is_simple_element);

		return html;
	},
	getInsertsData: function(){
		var insertsData = {};
		if(!this.insertManager)
			return {};

		_.each(this.insertManager.inserts, function(insert){
			insertsData[insert.data.id] = insert.data.toJSON();
		});

		return insertsData;
	}
};



/*-----------------------------
	PLUGINS
-------------------------------*/

if (!RedactorPlugins) var RedactorPlugins = {};

UpfrontRedactorPanels = _.extend(RedactorPlugins, {
	init : function(){
		console.log(this.buttons);
	}
});
/*
	STATE BUTTONS PLUGIN
 */
RedactorPlugins.stateButtons = {
	init: function(){
		var self = this;
		this.addStateButtons();
		this.startStateObserver();

	},
	addStateButtons: function(){
		if(this.stateButtons)
			return;

		var me = this;
		this.stateButtons = {};
		$.each(this.opts.stateButtons, function(id, data){
			var button = new me.StateButton(id, data);
			me.buttonAdd(id, data.title, function(){ me.stateCallback( id, button ) });
			// set state of button
			me.$air.on("show", function(){
				button.guessState(me);
			});
		});
	},
	stateCallback : function( id, button ){
		button.guessState( this );
		button.callback(id, this.buttonGet(id) ,button );
	},
	startStateObserver: function(){
		var observer = $.proxy(this.stateObserver, this);
		this.$element.on('mouseup.redactor keyup.redactor', observer);
	},

	stateObserver: function(){
		var me = this;
		$.each(this.stateButtons, function(id, button){
			button.guessState(me);
		});
		me.waitForMouseUp = false; //Prevent handler bound to document.mouseup
	},

	StateButton: function(id, data){
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

		$.each(me.states, function(id, state){
			if(previousState){
				nextStates[previousState] = id;
			}
			else
				firstState = id;
			me.iconClasses += ' ' + state.iconClass;
			previousState = id;
		});
		nextStates[previousState] = firstState;

		me.nextStates = nextStates;

		me.nextState = function(el){
			this.setState(me.nextStates[this.currentState], el);
		};
		me.setState = function(id, el){
			this.currentState = id;
			el.removeClass(this.iconClasses)
				.addClass(this.states[this.currentState].iconClass)
			;
		};
		me.triggerState = function(redactor, name, el, button){
			var callback = $.proxy(this.states[this.currentState].callback, redactor);
			callback(name, el, button);
		};
		me.guessState = function(redactor) {
			var found = false;
			$.each(this.states, function(id, state){
				found = state.isActive(redactor) ? id : found;
			});
			if(!found)
				found = this.defaultState;
			this.setState(found, redactor.buttonGet(this.id));
		};
		me.getElement = function(redactor){
			return redactor.$toolbar.find('.redactor_btn_' + this.id);
		};
		return {
			id: id,
			title: data.title,
			callback: function(name, el, button) {
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



/*--------------------
	ALIGMENT BUTTON
--------------------- */
RedactorPlugins.stateAlignment = {
	beforeInit: function(){
		var self = this;
		this.opts.stateButtons.stateAlign = {
			title: 'Text alignment',
			defaultState: 'left',
			states: {
				left: {
					iconClass: 'ueditor-left',
					isActive: function(redactor){
						var $parent = $(redactor.getSelection().baseNode);
						if($parent.length && $parent[0].nodeType == 3)
							$parent = $parent.parent();
						return $parent.length && $parent.css('text-align') == 'left';
					},
					callback: function(name, el , button){
						self.alignmentLeft();
					}
				},
				center: {
					iconClass: 'ueditor-center',
					isActive: function(redactor){
						var $parent = $(redactor.getSelection().baseNode);
						if($parent.length && $parent[0].nodeType == 3)
							$parent = $parent.parent();
						return $parent.length && $parent.css('text-align') == 'center';
					},
					callback: function(name, el , button){
						self.alignmentCenter();
					}
				},
				right: {
					iconClass: 'ueditor-right',
					isActive: function(redactor){
						var $parent = $(redactor.getSelection().baseNode);
						if($parent.length && $parent[0].nodeType == 3)
							$parent = $parent.parent();
						return $parent.length && $parent.css('text-align') == 'right';
					},
					callback: function(name, el , button){
						self.alignmentRight();
					}
				},
				justify: {
					iconClass: 'ueditor-justify',
					isActive: function(redactor){
						var $parent = $(redactor.getSelection().baseNode);
						if($parent.length && $parent[0].nodeType == 3)
							$parent = $parent.parent();
						return $parent.length && $parent.css('text-align') == 'justify';
					},
					callback: function(name, el , button){
						self.alignmentJustify();
					}
				}
			}
		}
	}
}


RedactorPlugins.stateLists = {
	beforeInit: function(){
		var self = this;
		this.opts.stateButtons.stateLists = {
			title: 'List style',
			defaultState: 'none',
			states: {
				none: {
					iconClass: 'ueditor-nolist',
					isActive: function(redactor){
						var $parent = $(redactor.getParent());
						return $parent.length && $parent.css('text-align') == 'left';
					},
					callback: function(name, el , button){
						self.execLists('insertorderedlist', 'orderedlist');
					}
				},
				unordered: {
					iconClass: 'ueditor-unorderedlist',
					isActive: function(redactor){
						var $parent = $(redactor.getParent());
						if($parent.length){
							var list = $parent.closest('ul');
							if(list.length)
								return list.closest('.ueditable').length;
						}
						return false;
					},
					callback: function(name, el , button){
						self.execLists('insertunorderedlist', 'unorderedlist');
					}
				},
				ordered: {
					iconClass: 'ueditor-orderedlist',
					isActive: function(redactor){
						var $parent = $(redactor.getParent());
						if($parent.length){
							var list = $parent.closest('ol');
							if(list.length)
								return list.closest('.ueditable').length;
						}
						return false;
					},
					callback: function(name, el , button){
						self.execLists('insertorderedlist', 'orderedlist');
					}
				}
			}
		}
	}
}

/*-------------------
	Panel Buttons
 -------------------*/

RedactorPlugins.panelButtons = {
	beforeInit : function(){
		var self = this;
		// $.each(this.opts.buttonsCustom, function(id, b){
		// 	console.log(id, b);
		// 		self.buttonAdd(id, b.title);
		// });		
	},
	init: function(){
		var me = this;
		$.each(this.opts.buttonsCustom, function(id, b){
			if(b.panel){
				var $panel = $('<div class="redactor_dropdown ueditor_panel redactor_dropdown_box_' + id + '" style="display: none;">'),
					$button = me.buttonGet( id )
				;

				b.panel = new b.panel({redactor: me, button: $button, panel: $panel});
				$panel.html(b.panel.$el);
				$panel.appendTo(me.$toolbar);
				b.dropdown = true;

				$button.on('click', function(){
					if($button.hasClass('dropact')){
						me.selectionRemoveMarkers();
						b.panel.trigger('open', me);
					}
					else{
						b.panel.trigger('closed', me);
					}
				});
				me.$editor.on('mouseup.redactor keyup.redactor', function(){
					if($button.hasClass('dropact')){ //It's open, so we close it
						me.dropdownHideAll();
						b.panel.trigger('closed', me);
					}
				});

				$panel
					.on('click keydown keyup', function(e){
						e.stopPropagation();
					})
				;
				me.buttonAdd(id, b.title, function(){
					var $button = me.buttonGet( id ),
						left = $button.position().left;

					$(".re-icon").removeClass( "redactor_act dropact" );
					$button.addClass("redactor_act dropact");
					$(".redactor_dropdown").not($panel).hide();

					$panel.css("left", left + "px").toggle();


					/**
					 * Triggers panel open or close events
					 */
					if( $panel.is(":visible") && typeof b.panel.open === "function" ){
						b.panel.open.apply(b.panel, [jQuery.Event( "open" ), me]);
					}else{
						if( typeof b.panel.close === "function" ){
							b.panel.close.apply(jQuery.Event( "close" ), [$.Event, me]);
						}
					}

					/**
					 * Makes sure the last button's panel is kept under the toolbar
					 * @type {[type]}
					 */
					var $last = $(".redactor_dropdown.ueditor_panel").last(),
						lastDropdownLeft = left - $last.innerWidth() + $button.width();
					$last.css( "left", lastDropdownLeft + "px" );
				}, false);

				
			}
		});
	}
}

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


/*--------------------
	Upfront link panel button
-----------------------*/

RedactorPlugins.upfrontLink = {
	// init : function(){
	// 	this.buttonAdd("link", "Link", this.openPanel);
	// },
	openPanel : function(){
		var left = this.buttonGet( "link" ).position().left;
		$(".redactor_dropdown_box_upfrontLink").css("left", left + "px").toggle();
	},
	beforeInit: function(){
		this.opts.buttonsCustom.upfrontLink = {
			title: 'Link',
			panel: this.panel
		};
	},
	panel: UeditorPanel.extend({
		tpl: _.template($(tpl).find('#link-tpl').html()),
		events:{
			open: 'open'
		},
		initialize: function(){
			this.linkPanel = new Upfront.Views.Editor.LinkPanel({linkTypes: {unlink: true}, button: true});
			this.bindEvents();
			UeditorPanel.prototype.initialize.apply(this, arguments);
		},
		render: function(options){
			options = options || {};
			console.log(options);
			this.linkPanel.model.set({
				url: options.url,
				type: options.link || this.guessLinkType(options.url)
			});

			this.linkPanel.render();
			this.$el.html(this.linkPanel.el);
			this.linkPanel.delegateEvents();
		},
		open: function(e, redactor){
			this.redactor = redactor;

			var link = redactor.currentOrParentIs('A');

			if(link){
				this.render({url: $(link).attr('href'), link: $(link).attr('rel') || 'external'});
			}
			else
				this.render();
		},
		close: function(e, redactor){
			this.redactor.selectionRemoveMarkers();
		},
		unlink: function(e){
			if(e)
				e.preventDefault();
         var text = this.redactor.getSelectionHtml();
         if( $.parseHTML(text).length > 1){// there is html inside
             this.redactor.execCommand('inserthtml', text, true);
         }else{
             this.redactor.execCommand('unlink');
         }

		},
		link: function(url, type){
			if(url){
				this.redactor.selectionRestore(true, false);
                var caption = this.redactor.getSelectionHtml();
                this.redactor.execCommand("inserthtml", '<a href="' + url + '" rel="' + type + '">' + caption + '</a>', true);
			}
		},

		bindEvents: function(){
			this.listenTo(this.linkPanel, 'link:ok', function(data){
				if(data.type == 'unlink')
					this.unlink();
				else
					this.link(data.url, data.type);

				this.closeToolbar();
			});

			this.listenTo(this.linkPanel, 'link:postselector', this.disableEditorStop);

			this.listenTo(this.linkPanel, 'link:postselected', function(data){
				this.enableEditorStop();
				this.link(data.url, data.type);
			});
		},

		guessLinkType: function(url){
			if(!$.trim(url))
				return 'unlink';
			if(url.lenght && url[0] == '#')
				return 'anchor';
			if(url.substring(0, location.origin.length) == location.origin)
				return 'entry';

			return 'external';
		}

	})
}

RedactorPlugins.upfrontColor = {
	beforeInit: function(){
		this.opts.buttonsCustom.upfrontColor = {
			title: 'Color',
			panel: this.panel
		};
	},
	panel: UeditorPanel.extend({
		current_color: false,
		current_bg: false,
		events:{
			'open': 'open'
		},
		close : function(e, redactor){
			redactor.cleanRemoveEmptyTags(redactor.getCurrent());
		},
		setCurrentColors: function() {

			var parent = this.redactor.getCurrent();
			if( (parent && $(parent).prop('tagName')=='INLINE') || $( parent ).hasClass(".upfront_theme_colors")) {

				var bg_color = tinycolor($(parent).css('background-color'));
				this.current_color = $(parent).css('color');
				if(bg_color.getAlpha() > 0)
					this.current_bg = $(parent).css('background-color');
			}
			else {
				this.current_color = this.current_bg = false;
			}
		},
		open: function(e, redactor){
			this.updateIcon();
			this.setCurrentColors();
			var self = this,
				foreground_picker = new Upfront.Views.Editor.Field.Color({
						spectrum: {
							flat: true,
							showAlpha: true,
							appendTo : "parent",
							showPalette: true,
							localStorageKey: "spectrum.recent_colors",
							maxSelectionSize: 10,
							preferredFormat: "hex",
							chooseText: "Ok",
							showInput: true,
			                allowEmpty: true,
			                change: function(color) {
								self.current_color = color;	
							},
							move: function(color) {
								redactor.selectionRestore(true, false);
								self.current_color = color;
							}
						}
				}),
				background_picker = new Upfront.Views.Editor.Field.Color({
						blank_alpha : 0,
						spectrum: {
							flat: true,
							showAlpha: true,
							appendTo : "parent",
							showPalette: true,
							localStorageKey: "spectrum.recent_bgs",
							maxSelectionSize: 10,
							preferredFormat: "hex",
							chooseText: "Ok",
							showInput: true,
			                allowEmpty: true,
			                change: function(color) {
								self.current_bg = color;	
							},
							move: function(color) {
								redactor.selectionRestore(true, false);
								self.current_bg = color;	
							}
						}
				});

			foreground_picker.render();
			this.$("#tabforeground-content").html( foreground_picker.el );

			background_picker.render();
			this.$("#tabbackground-content").html( background_picker.el );
			
			if(this.current_color) {
				var color = tinycolor(self.current_color);
				foreground_picker.$(".upfront-field-color").spectrum("option", "color", self.current_color);
				foreground_picker.$(".upfront-field-color").spectrum("set", color);
				foreground_picker.$(".sp-input").css({
					"border-left-color" : self.current_color
				});
				foreground_picker.render_sidebar_rgba(color.toRgb());
				foreground_picker.update_input_val( color.toHexString() );
			}
			else{
				var color = tinycolor("#000000");
				foreground_picker.$(".upfront-field-color").spectrum("option", "color", "#000000");
				foreground_picker.$(".upfront-field-color").spectrum("set", color);
				background_picker.$(".sp-input").css({
					"border-left-color" : "#000000"
				});	
				foreground_picker.render_sidebar_rgba(color.toRgb());
				foreground_picker.update_input_val( color.toHexString() );
			}

			if(this.current_bg) {
				var color = tinycolor(self.current_bg);
				background_picker.$(".upfront-field-color").spectrum("option", "color", self.current_bg);
				background_picker.$(".upfront-field-color").spectrum("set", color);
				background_picker.$(".sp-input").css({
					"border-left-color" : self.current_bg
				});			
				background_picker.render_sidebar_rgba(color.toRgb());
				background_picker.update_input_val( color.toHexString() );	
			}
			else{
				var color = tinycolor("rgba(0, 0, 0, 0)");
				background_picker.$(".upfront-field-color").spectrum("option", "color", "rgba(0, 0, 0, 0)");
				background_picker.$(".upfront-field-color").spectrum("set", color);
				background_picker.$(".sp-input").css({
					"border-left-color" : "rgba(0, 0, 0, 0)"
				});		
				background_picker.render_sidebar_rgba(color.toRgb());
				background_picker.update_input_val( color.toHexString() );
			}


//			this.$('input.foreground').spectrum('resetUI');
//			this.$('input.background').spectrum('resetUI');
//			

		    this.$(".sp-choose").on("click", function(){
		    	self.updateColors();
	    		self.closePanel();
				self.closeToolbar();
				self.redactor.dropdownHideAll();
		    });
		},
		render: function(){

			var tabforeground = $('<li id="tabforeground" class="active">').html('Text Color');
			var tabbackground = $('<li id="tabbackground">').html('Text Background');
			var tablist = $('<ul class="tablist">').append(tabforeground).append(tabbackground);

			var tabs = $('<ul class="tabs">').append($('<li id="tabforeground-content" class="active">').html('<input class="foreground" type="text">')).append($('<li id="tabbackground-content">').html('<input class="background" type="text">'));

			var redac = this.redactor;
			var self = this;

			redac.bufferAirBindHide = this.redactor.airBindHide;

			redac.airBindHide = function() {
				self.updateIcon();
				redac.bufferAirBindHide();
			};

			tablist.children('li').on('click', function() {
				tablist.children('li').removeClass('active');
				$(this).addClass('active');
				tabs.children('li').removeClass('active');
				tabs.children('li#'+$(this).attr('id')+'-content').addClass('active');

				self.$('input.foreground').spectrum('option', 'color', typeof(self.current_color) == 'object' ? self.current_color.toRgbString() : self.current_color);
//				self.$('input.foreground').spectrum('resetUI');
				self.$('input.background').spectrum('option', 'color',  typeof(self.current_bg) == 'object' ? self.current_bg.toRgbString() : self.current_bg);
//				self.$('input.background').spectrum('resetUI');
			});

			this.$el.html(tablist).append(tabs);
			//redac.selectionSave();
			
		},
		updateIcon : function () {
				var self = this;
				self.setCurrentColors();
				if(self.current_bg){
					var color = tinycolor( self.current_bg );
					if( color.getAlpha() === 0 ){
						this.redactor.$toolbar.find('.re-icon.re-upfrontColor').addClass('transparent').css('border-color', "");
					}else{
						this.redactor.$toolbar.find('.re-icon.re-upfrontColor').removeClass('transparent').css('border-color', color.toRgbString());
					}
				}
				else{
					this.redactor.$toolbar.find('.re-icon.re-upfrontColor').addClass('transparent').css('border-color', '');
				}


				if(self.current_color)
					this.redactor.$toolbar.find('.re-icon.re-upfrontColor').css('color',  self.current_color );
				else
					this.redactor.$toolbar.find('.re-icon.re-upfrontColor').css('color',  '');

		},
		updateColors : function() {

			var self = this,
				parent = this.redactor.getParent(),
				bg = "";
				bg_class = "",
				html = ""; 

				/**
				 * Set background color
				 */
				if(self.current_bg && typeof(self.current_bg) == 'object') {
               		this.redactor.inlineRemoveStyle("background-color");
               		bg = 'background-color:' + self.current_bg.toRgbString();
               		bg_class =  Upfront.Views.Theme_Colors.colors.get_css_class( self.current_bg.toHexString(), true );
               		
               		if( bg_class ){
               			bg = "";
               			bg_class += " upfront_theme_colors";
               		}else{
               			bg_class = "inline_color";
               		}
                }

                /**
                 * Set font color
                 */
                if(self.current_color && typeof(self.current_color) == 'object') {
                    var theme_color_classname =  Upfront.Views.Theme_Colors.colors.get_css_class( self.current_color.toHexString() );
                    if( theme_color_classname ){
                        var current = this.redactor.getCurrent();
                        if( !$(current).hasClass(theme_color_classname) ){

 					   this.redactor.selectionRestore(true, true);
                       this.redactor.bufferSet();
                       this.redactor.$editor.focus();
                       this.redactor.inlineRemoveStyle("color");
                       this.redactor.inlineRemoveClass( "upfront_theme_colors" );
                       this.redactor.inlineRemoveClass( "inline_color" );
                       html = this.redactor.cleanHtml(this.redactor.cleanRemoveEmptyTags(this.redactor.getSelectionHtml()));

                        html = "<span class='upfront_theme_colors " + theme_color_classname + " " + bg_class + "' style='" + bg  + "'>"  + html + "</span>";
                        //this.redactor.execCommand("inserthtml", html, true);
                        }
                    }else{
                        // Making sure it doesn't have any theme color classes
                        _.each(Upfront.Views.Theme_Colors.colors.get_all_classes(), function( cls ){
                            self.redactor.inlineRemoveClass( cls );
                        });

					   this.redactor.selectionRestore(true, true);
                       this.redactor.bufferSet();
                       this.redactor.$editor.focus();
                       this.redactor.inlineRemoveStyle("color");
                       this.redactor.inlineRemoveClass( "upfront_theme_colors" );
                       this.redactor.inlineRemoveClass( "inline_color" );

                       html = this.redactor.cleanHtml(this.redactor.cleanRemoveEmptyTags(this.redactor.getSelectionHtml()));
                       html = "<inline class='inline_color' style='color: " + self.current_color.toRgbString() + ";" + bg +"'>" + html + "</inline>";
                       
                    }
                }


                if( html === "" ){
                	html = this.redactor.cleanHtml(this.redactor.cleanRemoveEmptyTags(this.redactor.getSelectionHtml()));
                    html = "<inline class='" + bg_class +  "' style='" + bg +"'>" + html + "</inline>";
                }
              
				this.redactor.execCommand("inserthtml", html, true);

                // Doing more cleanup
                if( $.trim( $(parent).text() ).localeCompare( $.trim( $(html).text() ) )  === 0 && ( $(parent).hasClass("inline_color") || $(parent).hasClass("upfront_theme_colors") ) ){
     				// $(parent).replaceWith( html );
             	}

				self.updateIcon();
				self.redactor.selectionRemoveMarkers();
				self.redactor.syncClean();
			}
	})
};


RedactorPlugins.upfrontFormatting = {
	init: function(){
		var self = this,
			buttons = {},
			tags =  {
				p: 'P',
				h1: 'H1',
				h2: 'H2',
				h3: 'H3',
				h4: 'H4',
				h5: 'H5',
				pre: '&lt;/&gt;',
				blockquote: '"'
			};
		$.each( tags, function( id, tag ){
			buttons[id] = { title: tag, callback: self.applyTag };
		} );
		this.buttonAddFirst('upfrontFormatting', 'Formatting', false, buttons);

		UeditorEvents.on("ueditor:dropdownShow", function(){
			var tag = $(self.getElement()).length ?  $(self.getElement())[0].tagName : false;
			if( tag ){
				tag = tag.toLowerCase();
				$(".redactor_dropdown_box_upfrontFormatting a").removeClass("active");
				$(".redactor_dropdown_" + tag).addClass("active");
			}
		});
	},
	applyTag: function(tag){
		this.selectionRestore(true, true);
        this.bufferSet();
        this.$editor.focus();
		var text_align = $( this.getCurrent() ).css("text-align");

		this.formatBlocks(tag);

		if( typeof text_align !==  "undefined" ) 
			this.blockSetStyle( "text-align", text_align );

		this.dropdownHideAll();
	}
};

RedactorPlugins.blockquote = {
	beforeInit: function() {
		var me = this;
		this.opts.stateButtons.blockquote = {
			title: 'Set a quote',
			defaultState: 'noquote',
			states: {
				noquote: {
					iconClass: 'ueditor-noquote',
					isActive: function(redactor){
						var quote = me.getQuote();
						return !quote;
					},
					callback: function(name, el , button){
						me.formatQuote('blockquote');
					}
				},
				quote:{
					iconClass: 'ueditor-quote',
					isActive: function(redactor){
						var quote = me.getQuote();
						return quote && !$(quote).hasClass('upfront-quote-alternative');
					},
					callback: function(name, el , button){
						me.formatQuote('blockquote');
					}
				},
				alternative: {
					iconClass: 'ueditor-quote-alternative',
					isActive: function(redactor){
						var quote = me.getQuote();
						return quote && $(quote).hasClass('upfront-quote-alternative');
					},
					callback: function(name, el , button){
						me.getQuote().addClass('upfront-quote-alternative');
					}
				}
			}
		};

	},
	getQuote: function() {
		var quote = $(this.getParent());
		if(quote.prop('tagName') == 'BLOCKQUOTE')
			return quote;
		quote = quote.closest('blockquote');
		return quote.closest('.redactor_box').length ? quote : false;
	}
};

var InsertManager = Backbone.View.extend({
	initialize: function(opts){
		this.inserts = {},
		this.onRemoveInsert = _.bind(this.removeInsert, this);
		this.insertsData = opts.insertsData || {};
		this.deletedInserts = {};
		this.$el.children().addClass('nosortable');
		this.insertLookUp();
		this.bindTriggerEvents();
		this.refreshTimeout = false;
		this.sortableInserts();
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
		if (ed && ed.redactor) {
			ed.redactor.events.on("ueditor:stop", function () {
				me.currentBlock = me.lastBlock = false;
			});
		}

		this.ticking = false;

		//Left marker used to place the trigger correctly when
		// there is an isert floated to the left
		this.leftMarker = $('<span style="float:left">');

		bindMouseEvents();

		if(!parent.find('#upfront-post-media-trigger').length) {
			parent.append('<div class="upfront-image-attachment-bits" id="upfront-post-media-trigger">');
			//me.$el.find("p").append('<div class="upfront-image-attachment-bits" id="upfront-post-media-trigger">');
		}

		me.mediaTrigger = parent.find('#upfront-post-media-trigger')
			.off('click')
			.on('click', function (e){
				e.stopPropagation();
				e.preventDefault();

				me.$el.off('mousemove', onMousemove);
				me.$el.off('mouseenter', onMouseenter);
				me.$el.off('mouseleave', onMouseleave);

				me.mediaTrigger.addClass('upfront-post-media-trigger-visible');

				var tooltip = $('<div class="uinsert-selector upfront-ui"></div>');
				tooltip.css('margin-left', me.mediaTrigger.css('margin-left'));

				_.each(Inserts.inserts, function(insert, type){
					tooltip.append('<a href="#" class="uinsert-selector-option uinsert-selector-' + type + '" data-insert="' + type + '">' + type + '</a>');
				});

				tooltip.on('click', 'a', function(e){
					e.preventDefault();
					e.stopPropagation();
					var type = $(e.target).data('insert'),
						insert = new Inserts.inserts[type](),
						block = me.lastBlock,
						where = me.mediaTrigger.data('insert')
					;

					insert.start()
						.done(function(popup, results){
							if(!results)
								return;
							me.inserts[insert.cid] = insert;
							//Allow to undo
							//this.trigger('insert:prechange'); // "this" is the embedded image object
							//me.trigger('insert:prechange'); // "me" is the view
							//Create the insert
							insert.render();
console.log("POSITION BEFORE", block, where);
if (!block) block = me.$el.find("p:last");
if (!where) where = 'after';
if (block.is(".nosortable") && !block.is("p")) where = 'append'; // Take padding into account
console.log("POSITION AFTER", block, where);
							block[where](insert.$el);
							me.trigger('insert:added', insert);
							me.insertsData[insert.data.id] = insert.data.toJSON();
							me.listenTo(insert.data, 'change add remove update', function(){
								me.insertsData[insert.data.id] = insert.data.toJSON();
							});

							me.listenTo(insert, 'remove', me.onRemoveInsert);
						})
					;
				});

				tooltip.css({top: me.mediaTrigger.css('top')});

				parent.append(tooltip);

				// We need to wait to finish the current event
				setTimeout(function(){
					$(document).one('click', function(e){
						tooltip.fadeOut('fast', function(){
							tooltip.remove();

							//Reset mouse events, jsut in case...
							me.$el.off('mousemove', onMousemove);
							me.$el.off('mouseenter', onMouseenter);
							me.$el.off('mouseleave', onMouseleave);
							bindMouseEvents();
						});
					});
				}, 10);
			})
		;
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

		_.each(Inserts.inserts, function(Insert){
			_.extend(me.inserts, Insert.prototype.importInserts(me.$el, insertsData));
		});

		_.each(me.inserts, function(insert){
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
		_.each(this.inserts, function(insert){
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
					me.inserts[id] = insert;
					delete me.deletedInserts[id];/*

					//We need to re-create the controls in order to make them work again
					element.replaceWith(insert.el);
					insert.createControls();
					if(insert.controls)
						insert.$el.append(insert.controls.el);
					insert.delegateEvents();*/
				}
			});
			_.each(me.inserts, function(insert, id){
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
						delete me.inserts[id];
					}
				}
			});
			me.$el.children(':not(.ueditor-insert)').addClass('nosortable');
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
				e.data.redactor.sync();
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
			e.data.redactor.sync();
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
				e.data.redactor.sync();
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
				e.data.redactor.sync();
				return false;
			},
			right: function (e) {
				var $wrap = e.data.get_target(e.target),
					$img = $wrap.find('img');
				e.data.Align._apply($wrap, {float: "right"});
				e.data.Align._apply($img, {});
				e.data.show_dialog($wrap);
				Upfront.Events.trigger("upfront:editor:image_align", $wrap.get(), 'right');
				e.data.redactor.sync();
				return false;
			},
			full: function (e) {
				var $wrap = e.data.get_target(e.target),
					$img = $wrap.find('img');
				e.data.Align._apply($wrap, {});
				//e.data.Align._apply($img, {width: "100%"});
				e.data.show_dialog($wrap);
				Upfront.Events.trigger("upfront:editor:image_align", $wrap.get(), 'full');
				e.data.redactor.sync();
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
				e.data.redactor.sync();
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
			redactor.sync();
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
			redactor.sync();
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
					redactor.sync();
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
	},
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

			box = me.$toolbar.find('.redactor_dropdown_box_' + id);
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
		this.sync(); // sync first before get
		var html = this.get();
		if ( html == '' )
			this.$placeholder.show();
		else
			this.$placeholder.hide();
	}
};


/*--------------------
 Font icons button
 -----------------------*/
RedactorPlugins.upftonIcons = {
	$sel : false,
    beforeInit: function(){
        this.opts.buttonsCustom.upftonIcons = {
            title: 'Icons',
            panel: this.panel
        };
    },
    init : function(){
        UeditorEvents.on("ueditor:key:down", function(redactor, e){
            if( $( redactor.getParent() ).hasClass("uf_font_icon") || $( redactor.getCurrent() ).hasClass("uf_font_icon")){
                if( !( e.keyCode < 48 || e.keyCode > 90 ) ){
                    e.preventDefault();
                }
            }
        });
    },
    panel: UeditorPanel.extend(_.extend({}, Upfront.Views.Mixins.Upfront_Scroll_Mixin, {
        tpl: _.template($(tpl).find('#font-icons').html()),
        events:{
            'click .ueditor-font-icon': 'insert_icon',
            // "change input.font-icons-top" : 'update_offset',
            'open': 'open',
            'closed': 'close'
        },
        render: function(options){
            this.$el.html(this.tpl());
            this.stop_scroll_propagation(this.$el);
        },
        open: function(e, redactor){
            this.redactor = redactor;
            this.redactor.selectionRestore();
            this.set_current_icon();
            
            this.$el.parent().css({
                left : 193
            });
        },
        close : function(){
        	if( this.redactor ){
        		this.redactor.selectionRemoveMarkers();
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
        insert_icon : function(e){
			this.redactor.selectionRestore(true, false);
            var $icon = $( $(e.target).hasClass("ueditor-font-icon") ? $(e.target).html() : $(e.target).closest(".ueditor-font-icon").html() ),
            	fontSize = this.$(".font-icons-size").val(),
            	top = this.$(".font-icons-top").val();
				$icon.css({
	            	"font-size" : fontSize + "px",
	            	"top" : top + "px"
	            });
            this.redactor.execCommand("inserthtml", $icon[0].outerHTML , true);
           	this.redactor.sync();
            this.closePanel();
        },
        set_current_icon : function(){
        	this.redactor.selectionRestore(true, false);
        	window.re = this.redactor;
        	var $sel = $(this.redactor.getParent()).eq(0),
        		self = this;

        	if( !$sel.hasClass("uf_font_icon") ){
        		if( $sel.parent().hasClass("uf_font_icon") ) {$sel = $sel.parent()};
        	}
        	if( $sel.hasClass("uf_font_icon") ){
            	this.$(".font-icons-size").val( parseFloat( $sel.css("font-size") ) );
            	this.$(".font-icons-top").val( parseFloat( $sel.css("top") ) );

            	this.$(".upfront-font-icons-controlls input").on("change", function(e){
            		e.stopPropagation();
            		e.preventDefault();
            		self.redactor.selectionSave();
            		self.redactor.bufferSet();
            		var val = $(this).val() + "px";

            		if( $(this).hasClass("font-icons-size") ){
            			$sel.css("font-size", val);
            		}

            		if( $(this).hasClass( "font-icons-top" ) ){
            			$sel.css("top", val);
            		}
					self.redactor.sync();
            		
            		self.redactor.selectionRestore();

            	});
            	
            }
            self.redactor.sync();
        }

    }))
};

}); //End require

}(jQuery));
