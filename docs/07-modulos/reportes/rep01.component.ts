import { OnDestroy, OnInit } from "@angular/core";
import { Component } from "@angular/core";
import { LayoutService } from "app/pages/full-pages/layout/services/layout.service";
import { IMenuItem, NavigationService } from "app/pages/full-pages/layout/services/navigation.service";
import { ModuleSidenavService } from "app/pages/full-pages/layout/services/module-sidenav.service";
import { Subscription } from "rxjs";


@Component({
    selector: 'app-rep01',
    templateUrl: './rep01.component.html',
    styleUrls: ['./rep01.component.scss']
})
export class Rep01Component implements OnInit, OnDestroy {
    openExplorerDesk: boolean;
    openExplorerMob: boolean;
    menuItems: IMenuItem[];

    private menuItemsSub: Subscription;
    private moduleSidenavSub: Subscription;

    constructor(private nav: NavigationService, public layout: LayoutService, private moduleSidenav: ModuleSidenavService) { }

    ngOnDestroy(): void {
        if (this.menuItemsSub) {
            this.menuItemsSub.unsubscribe();
        }
        this.moduleSidenav.unregister();
        if (this.moduleSidenavSub) {
            this.moduleSidenavSub.unsubscribe();
        }
    }

    ngOnInit(): void {
        //this.openExplorer=this.layout.isMobile?false:true;
        this.openExplorerDesk = true;
        this.openExplorerMob = false;
        this.menuItemsSub = this.nav.menuItems$.subscribe(items => {
            let b: any = items.filter(e => e.cod === 'A_MOD_RCOM')[0];
            this.menuItems = b.sub;
        });
        this.moduleSidenav.register(this.layout.isMobile ? this.openExplorerMob : this.openExplorerDesk);
        this.moduleSidenavSub = this.moduleSidenav.toggle$.subscribe(() => this.toggleExplorer());
    }

    hideExplorer(evt) {
        if (evt) {
            this.openExplorerMob = false;
            this.moduleSidenav.setOpen(false);
        }
    }

    toggleExplorer() {
        if (!this.layout.isMobile) {
            this.openExplorerDesk = !this.openExplorerDesk;
            this.moduleSidenav.setOpen(this.openExplorerDesk);
        } else {
            this.openExplorerMob = !this.openExplorerMob;
            this.moduleSidenav.setOpen(this.openExplorerMob);
        }

    }

    calcWidth(): string {
        return this.layout.isMobile ? "width: 100%;" : "width: 260px";
    }
}