upfrontrjs.define([],function(){var n=function(){var n=[],t=[];this.add=function(t){Upfront.Events.trigger("upfront:renderingqueue:add"),n.push(function(e){t(),Upfront.Events.trigger("upfront:renderingqueue:progress"),!e&&n.length>0&&(e=n.shift()),setTimeout(function(){e?n.length>0?e(n.shift()):e():Upfront.Events.trigger("upfront:renderingqueue:finished")},0)})},this.addToEnd=function(n){Upfront.Events.trigger("upfront:renderingqueue:add"),t.push(function(e){n(),Upfront.Events.trigger("upfront:renderingqueue:progress"),setTimeout(function(){e&&(t.length>0?e(t.shift()):(e(),Upfront.Events.trigger("upfront:renderingqueue:done")))},0)})},this.start=function(){setTimeout(function(){Upfront.Events.trigger("upfront:renderingqueue:start"),n.length>1?n.shift()(n.shift()):n.length>0&&n.shift()()},500)},Upfront.Events.on("upfront:renderingqueue:finished",function(){t.length>1?t.shift()(t.shift()):t.length>0&&t.shift()()})},t=new n;return t});