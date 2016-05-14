//
//  AIBHTMLWebView.m
//  AIBHTMLWebView
//
//  Created by Thomas Parslow on 05/04/2015.
//  Copyright (c) 2015 Thomas Parslow. MIT License.
//

#import "AIBHTMLWebView.h"

#import <UIKit/UIKit.h>
#import "RCTEventDispatcher.h"
#import "UIView+React.h"
#import "RCTView.h"

@interface AIBHTMLWebView () <UIWebViewDelegate>

@end

@implementation AIBHTMLWebView
{
    RCTEventDispatcher *_eventDispatcher;
    UIWebView *_webView;
    BOOL autoHeight;
}

- (void)setHTML:(NSString *)HTML
{
    // TODO: Do we need to ensure that duplicate sets are ignored?
    [_webView loadHTMLString:HTML baseURL: [NSURL URLWithString: @""]];
    [self reportHeight];
}

- (void)setAutoHeight:(BOOL) enable
{
    _webView.scrollView.scrollEnabled = !enable;
    autoHeight = enable;
}


- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher
{
    if ((self = [super initWithFrame:CGRectZero])) {
        _eventDispatcher = eventDispatcher;
        _webView = [[UIWebView alloc] initWithFrame:self.bounds];
        _webView.delegate = self;
        [self addSubview:_webView];
        autoHeight = false;
    }
    return self;
}

- (void)layoutSubviews
{
    [super layoutSubviews];
    _webView.frame = self.bounds;
    [self reportHeight];
}

- (void)reportHeight
{
    if (!autoHeight) {
        return;
    }
    CGRect frame = _webView.frame;
    frame.size.height = 1;
    _webView.frame = frame;
    frame.size.height = [[_webView stringByEvaluatingJavaScriptFromString: @"document.documentElement.scrollHeight"] floatValue];
    NSNumber *height = [NSNumber numberWithFloat: frame.size.height];

    NSMutableDictionary *event = [[NSMutableDictionary alloc] initWithDictionary: @{
                                                                                    @"target": self.reactTag,
                                                                                    @"contentHeight": height
                                                                                    }];
    [_eventDispatcher sendInputEventWithName:@"changeHeight" body:event];
    _webView.frame = frame;
}

#pragma mark - UIWebViewDelegate methods

- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType {
    if ([[request.URL scheme] isEqual:@"file"] && navigationType==UIWebViewNavigationTypeOther) {
        // When we load from HTML string it still shows up as a request, so let's let that through
        return YES;
    } else {
        NSURL *url = request.URL;
        NSMutableDictionary *event = [[NSMutableDictionary alloc] initWithDictionary: @{
                                                                                        @"target": self.reactTag,
                                                                                        @"url": [request.URL absoluteString],
                                                                                        @"path": request.URL.path,
                                                                                        @"host": request.URL.host
                                                                                        }];
        [_eventDispatcher sendInputEventWithName:@"link" body:event];
        return NO; // Tells the webView not to load the URL
    }
}

- (void)webViewDidFinishLoad:(UIWebView *)webView {
    [_eventDispatcher sendInputEventWithName:@"doneLoading" body: @{
                                                                    @"target": self.reactTag
                                                                    }];
    [self reportHeight];
}

@end
