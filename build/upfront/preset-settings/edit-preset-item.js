define(["scripts/upfront/preset-settings/show-state-settings-button","scripts/upfront/preset-settings/state-settings"],function(e,t){var n=Upfront.Settings.l10n.preset_manager,r=Upfront.Views.Editor.Settings.Item.extend({className:"preset_specific",initialize:function(r){this.options=r||{},this.listenTo(this.model,"change",this.onPresetUpdate);var i=this,s=!1,o=!1;if(Upfront.Application.get_current()!==Upfront.Application.MODE.THEME&&this.options.model.get("theme_preset")===!0||this.options.model.get("id")==="default")if(Upfront.Application.get_current()===Upfront.Application.MODE.THEME||this.options.model.get("id")!=="default"&&this.options.model.get("theme_preset")!==!0)var u=[];else var u=[new Upfront.Views.Editor.Field.Button({model:this.model,label:"Reset",className:"delete_preset",compact:!0,on_click:function(){i.resetPreset()}})];else var u=[new Upfront.Views.Editor.Field.Button({model:this.model,label:n.delete_label,className:"delete_preset",compact:!0,on_click:function(){i.deletePreset()}})];_.each(this.options.stateFields,function(e,n){if(n==="Global"){var r=new t({model:this.model,fields:e,state:n});u.push(r)}},this),_.each(this.options.stateFields,function(t,n){if(n!=="Global"){var r=new e({state:n});u.push(r),this.listenTo(r,"upfront:presets:state_show",this.showState),s||(s=r)}},this),_.each(this.options.stateFields,function(e,n){if(n!=="Global"){var r=new t({model:this.model,fields:e,state:n});u.push(r),o?r.$el.hide():o=r}},this),setTimeout(function(){i.$el.find(".state_settings_button").wrapAll('<div class="state_settings_button_wrapper">')},50),s&&s.$el.addClass("active"),o&&o.$el.show(),this.fields=_(u)},onPresetUpdate:function(){this.trigger("upfront:presets:update",this.model.toJSON())},deletePreset:function(){this.trigger("upfront:presets:delete",this.model)},resetPreset:function(){this.trigger("upfront:presets:reset",this.model)},showState:function(e){this.$el.find(".state_settings_button").removeClass("active"),this.$el.find(".state_settings_button_"+e).addClass("active"),this.$el.find(".state_settings").hide(),this.$el.find(".state_settings_"+e).show()}});return r});