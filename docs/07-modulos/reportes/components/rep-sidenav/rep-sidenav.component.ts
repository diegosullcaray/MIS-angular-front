import { NestedTreeControl } from "@angular/cdk/tree";
import { EventEmitter, Host, OnDestroy, OnInit, Output } from "@angular/core";
import { Component, Input } from "@angular/core";
import { MatTreeNestedDataSource } from "@angular/material/tree";
import { NavigationEnd, Router } from "@angular/router";
import { LayoutService } from "app/pages/full-pages/layout/services/layout.service";
import { IMenuItem } from "app/pages/full-pages/layout/services/navigation.service";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";

interface IRepItem {
    name: string,
    state?: string,
    children?: IRepItem[];
}

@Component({
    selector: 'mod-rep-sidenav',
    templateUrl: './rep-sidenav.component.html',
    styleUrls: ['./rep-sidenav.component.scss']
})
export class RepSidenavComponent implements OnInit, OnDestroy {
    @Input() menuItems: IMenuItem[];

    treeControl = new NestedTreeControl<IRepItem>(node => node.children);
    dataSource = new MatTreeNestedDataSource<IRepItem>();

    activeUrl: string;

    @Output() onSelectMenuItem = new EventEmitter<any>();

    private routerSub: Subscription;

    constructor(private router: Router, private layout: LayoutService) {

    }

    ngOnInit(): void {
        let ds: IRepItem[] = [];
        this.menuItems.forEach(e => {
            let m: IRepItem = {
                name: e.name,
                state: e.state,
                children: this.genChilds(e.sub)
            }
            ds.push(m);
        });
        this.dataSource.data = ds;

        this.updateActiveUrl(this.router.url);
        this.routerSub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
            this.updateActiveUrl(e.urlAfterRedirects);
        });
    }

    ngOnDestroy(): void {
        if (this.routerSub) {
            this.routerSub.unsubscribe();
        }
    }

    public onClick(a) {
        this.onSelectMenuItem.emit(this.layout.isMobile);
        this.router.navigateByUrl(a);
        //this.router.navigateByUrl('/app/reportes/leg/dummy');
        this.updateActiveUrl(a);
    }

    public isActive(node: IRepItem): boolean {
        return !!node.state && !!this.activeUrl && this.activeUrl.indexOf(node.state) !== -1;
    }

    private updateActiveUrl(url: string): void {
        this.activeUrl = url;
        const path = this.findActivePath(this.dataSource.data, url);
        if (!path) {
            return;
        }
        path.forEach(ancestor => this.treeControl.expand(ancestor));
    }

    private findActivePath(nodes: IRepItem[], url: string): IRepItem[] {
        for (const node of nodes) {
            if (node.state && url.indexOf(node.state) !== -1) {
                return [node];
            }
            if (node.children && node.children.length) {
                const childPath = this.findActivePath(node.children, url);
                if (childPath) {
                    return [node, ...childPath];
                }
            }
        }
        return null;
    }

    private genChilds(sub: any[]): IRepItem[] {
        let mi: IRepItem[] = [];
        sub.forEach(e => {
            let m: IRepItem = {
                name: e.name,
                state: e.state,
                children: this.genChilds(e.sub)
            }
            mi.push(m);
        });
        return mi;
    }

    hasChild = (_: number, node: IRepItem) => !!node.children && node.children.length > 0;

}