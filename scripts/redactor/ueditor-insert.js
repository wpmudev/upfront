;(function($){
define(['text!scripts/redactor/ueditor-templates.html'], function(tpls){

/*
An insert is a part of a post content that have special functionality and should be stored in
a different way that it is shown.
A shortcode is a good example of insert:
	- It may have settings
	- It is stored as a string with the format [shortcode]
	- It is displayed as html

Insert purpose is let upfront handle this kind of parts of a post content with ease.

*/
var UeditorInsert = Backbone.View.extend({
    shortcodeName: 'ueditor-insert',
    attributes: {contenteditable: 'false'},
    defaultData : {},
    resizable: false,
	initialize: function(opts){
		opts = opts || {};
		var data = opts.data || {};
		//data = _.extend({}, this.defaultData, data); // lets merge data in the child classes
		if(!data.id){
			data.id = this.generate_new_id();
			//Trigger the insertcount change for updating the server
			Upfront.Events.trigger('content:insertcount:updated');
		}
		this.el.id = data.id;
		this.data = new Backbone.Model(data);
		this.listenTo(this.data, 'change add remove reset', this.render);
		this.createControls();

		if(typeof this.init == 'function')
			this.init( opts );
	},
    generate_new_id: function(){
       return 'uinsert-' + (++Upfront.data.ueditor.insertCount);
    },
	start: function(){
		//Dumb start method returning a resolved promise. Override it if async start needed.
		var deferred = $.Deferred();
		deferred.resolve();
		return deferred.promise();
	},
	getOutput: function(){
		var data = this.data.toJSON(),
			shortcode = '[ueditor-insert type="' + this.type + '"'
		;

		_.each(data, function(value, key){
			shortcode += ' ' + key + '="' + value + '"';
		});

		return shortcode + ']';
	},

	importInserts: function(contentElement){
		var me = this,
			regExp = new RegExp('(\[' + this.shortcodeName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '[^\]]*?\])', 'ig'),
			content = contentElement.html(),
			container = $('<div></div>')
		;

		content = content.replace(regExp, '<p class="ueditor-insert">$1</p>');

		var inserts = container.html(content).find('p.ueditor-insert');
		inserts.each(function(){
			var shortcode = me.parseShortcode(this.innerHTML);
			if(shortcode.type && insertObjects[shortcode.type]){

			}
		});

	},
	parseShortcode: function(text){
		var regexp = /\[([^\s\]]+)([^\]]*?)\]/i,
			attrRegExp = /(\w+)\s*=\s*"([^"]*)"(?:\s|$)|(\w+)\s*=\s*\'([^\']*)\'(?:\s|$)|(\w+)\s*=\s*([^\s\'"]+)(?:\s|$)|"([^"]*)"(?:\s|$)|(\S+)(?:\s|$)/ig,
			scData = text.match(regexp),
			shortcode = {},
			attrs
		;

		if(!scData)
			return false;

		shortcode.shortcodeName = scData[1];
		attrs = $.trim(scData[2]);
		if(attrs){
			var attrsData = attrs.match(attrRegExp);
			if(attrsData){
				_.each(attrsData, function(attr){
					attr = $.trim(attr);
					var parts = attr.split('=');
					if(parts.length == 1)
						shortcode[attr] = attr;
					else {
						var key = $.trim(parts[0]),
							value = $.trim(parts.slice(1).join('='))
						;
						if(value[0] == '"' && value[value.length -1] == '"' || value[0] == "'" && value[value.length - 1] == "'")
							value = value.slice(1, -1);
						shortcode[key] = value;
					}
				});
			}
		}

		return shortcode;
	},
	createControls: function(){
		var me = this,
			Controls = Upfront.Views.Editor.InlinePanels
		;
		if(this.controls){
			this.controls.remove();
			this.controls = false;
		}

		if(!this.controlsData)
			return;

		this.controls =  Controls.ControlPanel.extend( { position_v: 'top' } );
		this.controls = new this.controls();

		/*
		{
			type: 'simple',
			id: 'controlId',
			icon: 'iconclassname'
			tooltip: 'Awesome tooltip'
		}

		{
			type: 'multi',
			id, icon, tooltip,
			selected: '', // What is the selected item.
			subItems: [...simpleControls...]
		}

		{
			type: 'dialog',
			id, icon, tooltip,
			view: BBView // some Backbone View to be shown inside the tooltip
		}
		 */

		var items = [];
		_.each(this.controlsData, function(controlData){
			var control;
			if(controlData.type == 'simple'){
				control = me.createSimpleControl(controlData);
				me.controls.listenTo(control, 'click', function(){
					me.controls.trigger('control:click', control);
					me.controls.trigger('control:click:' + control.id, control);
				});
			}
			else if(controlData.type == 'multi'){
				control = new Controls.TooltipControl();
				control.selected = controlData.selected;

				if(controlData.subItems){
					var subItems = {};
					_.each(controlData.subItems, function(subItemData){
						subItems[subItemData.id] = me.createSimpleControl(subItemData);
					});
					control.sub_items = subItems;
				}

				me.controls.listenTo(control, 'select', function(item){
					me.controls.trigger('control:select:' + control.id, item);
				});
			}
			else if(controlData.type == 'dialog'){
				control = new Controls.DialogControl();
				control.view = controlData.view;
				me.controls.listenTo(control, 'panel:ok', function(view){
					me.controls.trigger('control:ok:' + control.id, view, control);
				});

				me.controls.listenTo(control, 'panel:open', function(){
					me.controls.$el.addClass('uinsert-control-visible');
					me.$el.addClass('nosortable');
				});
				me.controls.listenTo(control, 'panel:close', function(){
					me.controls.$el.removeClass('uinsert-control-visible');
					me.$el.removeClass('nosortable');
				});
			}

			if(control){
                _.extend(control, controlData);
				items.push(control);
			}
		});

		this.controls.items = _(items);
		this.controls.render();

		if(typeof this.controlEvents == 'function')
			this.controlEvents();

		this.controls.delegateEvents();
	},

	createSimpleControl: function(controlData){
		var control = new Upfront.Views.Editor.InlinePanels.Control();
		control.icon = controlData.icon;
		control.tooltip = controlData.tooltip;
		control.id = controlData.id;
		control.label = controlData.label;
		return control;
	},

	getAligmnentControlData: function(alignments){
		var types = {
				left: {id: 'left', icon: 'alignleft', tooltip: 'Align left'},
				right: {id: 'right', icon: 'alignright', tooltip: 'Align right'},
				center: {id: 'center', icon: 'aligncenter', tooltip: 'Align center'},
				full: {id: 'full', icon: 'alignfull', tooltip: 'Full width'}
			},
			control = {
				id: 'alignment',
				type: 'multi',
				icon: 'alignment',
				tooltip: 'Alignment',
				subItems: []
			}
		;
		_.each(alignments, function(align){
			if(types[align])
				control.subItems.push(types[align]);
		});
		return control;
	},
	getRemoveControlData: function(){
		return {
			id: 'remove',
			type: 'simple',
			icon: 'remove',
			tooltip: 'Delete'
		};
	},
	resizableInsert: function(){
		if( !this.resizable ) return;
		var me = this,
			align = this.data.get('align'),
			leftControl = true,
			rightControl = true,
			targetSelector = '.upfront-icon-control-resize-se',
			handles = {},
			grid = Upfront.Behaviors.GridEditor
		;


		if(this.$el.hasClass('ui-resizable'))
			this.$el.resizable('destroy');

		if(align == 'left')
			leftControl = false;
		else if(align == 'right'){
			rightControl = false;
			targetSelector = '.upfront-icon-control-resize-sw';
		}

		if(this.$(targetSelector).length){
		}
		else{
			if(rightControl){
				this.$el.append('<span class="upfront-icon-control upfront-icon-control-resize-se upfront-resize-handle-se ui-resizable-handle ui-resizable-se nosortable" style="display: inline;"></span>');
				handles.se = '.upfront-icon-control-resize-se';
			}
			if(leftControl){
				this.$el.append('<span class="upfront-icon-control upfront-icon-control-resize-sw upfront-resize-handle-sw ui-resizable-handle ui-resizable-sw nosortable" style="display: inline;"></span>');
				handles.sw = '.upfront-icon-control-resize-sw';
			}
		}

		var resizableOptions = this.getResizableOptions ? this.getResizableOptions() : {};
		resizableOptions.handles = handles;
		resizableOptions.grid = [grid.col_size, grid.baseline];

		this.$el.resizable(resizableOptions);
	}
});


return {
    UeditorInsert: UeditorInsert
};

//End Define
});})(jQuery);
