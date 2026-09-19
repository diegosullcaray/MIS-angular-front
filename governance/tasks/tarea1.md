sidebar.component.ts:130 ERROR RuntimeError: NG01352: If ngModel is used within a form tag, either the name attribute must be set or the form
    control must be defined as 'standalone' in ngModelOptions.

    Example 1: <input [(ngModel)]="person.firstName" name="first">
    Example 2: <input [(ngModel)]="person.firstName" [ngModelOptions]="{standalone: true}">
    at missingNameException (forms.mjs:2775:10)
    at NgModel._checkName (forms.mjs:3246:13)
    at NgModel._checkForErrors (forms.mjs:3241:10)
    at NgModel.ngOnChanges (forms.mjs:3161:10)
    at NgModel.rememberChangeHistoryAndInvokeOnChangesHook (_debug_node-chunk.mjs:101:10)
    at callHookInternal (_debug_node-chunk.mjs:251:10)
    at callHook (_debug_node-chunk.mjs:269:5)
    at callHooks (_debug_node-chunk.mjs:240:9)
    at executeInitAndCheckHooks (_debug_node-chunk.mjs:209:5)
    at selectIndexInternal (_debug_node-chunk.mjs:5286:9)

consulta-fen.service.ts:39 ERROR RuntimeError: NG01352: If ngModel is used within a form tag, either the name attribute must be set or the form
    control must be defined as 'standalone' in ngModelOptions.

    Example 1: <input [(ngModel)]="person.firstName" name="first">
    Example 2: <input [(ngModel)]="person.firstName" [ngModelOptions]="{standalone: true}">
    at missingNameException (forms.mjs:2775:10)
    at NgModel._checkName (forms.mjs:3246:13)
    at NgModel._checkForErrors (forms.mjs:3241:10)
    at NgModel.ngOnChanges (forms.mjs:3161:10)
    at NgModel.rememberChangeHistoryAndInvokeOnChangesHook (_debug_node-chunk.mjs:101:10)
    at callHookInternal (_debug_node-chunk.mjs:251:10)
    at callHook (_debug_node-chunk.mjs:269:5)
    at callHooks (_debug_node-chunk.mjs:240:9)
    at executeInitAndCheckHooks (_debug_node-chunk.mjs:209:5)
    at selectIndexInternal (_debug_node-chunk.mjs:5286:9)
﻿

