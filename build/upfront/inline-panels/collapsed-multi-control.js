!function(t){define(["scripts/upfront/inline-panels/control","scripts/upfront/inline-panels/multi-control"],function(e,n){var i=n.extend({collapsed:!0,className:"upfront-inline-panel-item inline-panel-collapsed-control",render:function(){if(!this.sub_items.collapsedControl){var t=new e;t.icon="collapsedControl",t.tooltip="More tools",this.sub_items.collapsedControl=t}this.selected="collapsedControl",this.constructor.__super__.render.call(this,arguments)},selectItem:function(e){var i=!1,o=!1,s=t(e.target).is("i")?t(e.target):t(e.target).find("i");if(_.each(this.sub_items,function(t,e){s.hasClass("upfront-icon-region-"+t.icon)&&(i=t,o=e)}),i){if(i instanceof n||i.multiControl===!0)return!1;this.render(),this.trigger("select",o)}},open_subitem:function(){_.each(this.sub_items,function(t){t instanceof n&&t.close_subitem()}),this.constructor.__super__.open_subitem.call(this,arguments)}});return i})}(jQuery);