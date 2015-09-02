(function(e){define(["elements/upfront-newnavigation/js/menu-util","scripts/upfront/settings/modules/menu-structure/menu-item"],function(t,n){var r=Upfront.Settings.l10n.preset_manager,i=Backbone.View.extend({className:"settings_module menu_structure_module clearfix",handlesSaving:!0,events:{"mouseenter .menu-item-header":"enableSorting","mouseout .menu-item-header":"disableSorting"},initialize:function(e){var r=this;this.options=e||{},this.menuId=this.model.get_property_value_by_name("menu_id"),this.menu=t.getMenuById(this.menuId),this.menuItems=[],this.menuItemViews=[],Upfront.Util.post({action:"upfront_new_load_menu_array",data:this.menuId}).success(function(e){r.menuItems=e.data||[],_.each(r.menuItems,function(e){r.menuItemViews.push(new n({model:new Backbone.Model(e),menuId:r.menuId}))}),r.render()}).error(function(e){Upfront.Util.log("Error loading menu items")})},render:function(){var e=this;this.$el.html('<div class="menu-structure-header"><span class="upfront-settings-item-title">MENU STRUCTURE</span><span class="add-menu-item">Add item</span></div>');if(_.isEmpty(this.menuItems)){this.$el.html("Loading...");return}_.each(this.menuItemViews,function(e){this.$el.append(e.render().el)},this),this.$el.sortable({axis:"y",items:".menu-structure-module-item",start:function(t,n){e.watchItemDepth(n.item)},stop:function(t,n){e.stopWatchingItemDepth(n.item),e.updateItemsPosition(n.item)}}),this.disableSorting()},enableSorting:function(){this.$el.sortable("enable")},disableSorting:function(){this.$el.sortable("disable")},watchItemDepth:function(e){var t=this,n;this.$el.on("mousemove",function(r){if(_.isUndefined(n)){n=r.pageX;return}t.updateItemDepth(n,r.pageX,e),n=r.pageX})},updateItemDepth:function(e,t,n){var r=n.data("menu-item-depth"),i=n.prev().data("menu-item-depth"),s=n.nextAll().not(".ui-sortable-placeholder").first().data("menu-item-depth"),o=r;e>t&&this.decreaseItemDepth(o-1,r,i,s,n),e<t&&this.increaseItemDepth(o+1,r,i,s,n)},decreaseItemDepth:function(e,t,n,r,i){n<t&&r<t&&(i.data("menu-item-depth",e),i.removeClass("menu-structure-item-depth-"+t),i.addClass("menu-structure-item-depth-"+e)),n===t&&r<t&&(i.data("menu-item-depth",e),i.removeClass("menu-structure-item-depth-"+t),i.addClass("menu-structure-item-depth-"+e))},increaseItemDepth:function(e,t,n,r,i){n>=t&&(i.data("menu-item-depth",e),i.removeClass("menu-structure-item-depth-"+t),i.addClass("menu-structure-item-depth-"+e)),n===t&&r<t&&(i.data("menu-item-depth",e),i.removeClass("menu-structure-item-depth-"+t),i.addClass("menu-structure-item-depth-"+e))},stopWatchingItemDepth:function(){this.$el.off("mousemove")},flattenItem:function(e){var t=this,n=[e];return e.sub&&_.each(e.sub,function(e){n=_.union(n,t.flattenItem(e))}),n},updateItemsPosition:function(t){var n=this,r=[];_.each(this.menuItems,function(e){r=_.union(r,n.flattenItem(e))});var i=this.$el.find(".menu-structure-module-item"),s=[],o=[0],u=0,a=1,f=0;i.each(function(){var t=_.findWhere(r,{"menu-item-object-id":e(this).data("menuItemObjectId")}),n=e(this).data("menuItemDepth");n>f?(o.push(u),f+=1):n!==f&&n<f&&(o=_.initial(o),f-=1),s.push(_.extend(t,{"menu-item-parent-id":_.last(o)||0,"menu-item-position":a})),a+=1,u=t["menu-item-object-id"]}),Upfront.Util.post({action:"upfront_update_menu_items",data:{items:s,menuId:this.menuId}}).fail(function(e){Upfront.Util.log("Failed saving menu items.")})},save_fields:function(){}});return i})})(jQuery);