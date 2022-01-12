import { AfterContentChecked, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { BaseResourceService } from 'src/app/shared/services/base-resource.service';
import toastr from "toastr";
import { BaseResourceModel } from '../../models/base-resource.model';


export abstract class BaseResourceFormComponent<T extends BaseResourceModel> implements OnInit, AfterContentChecked {

  currentAction: string;
  resourceForm: FormGroup;
  pageTitle: string;
  serverErrorMessages: string[] = null;
  submittingForm: boolean = false;

  protected route: ActivatedRoute;
  protected router: Router;
  protected formBuilder: FormBuilder;

  constructor(
    protected injector: Injector , 
    public resource: T,
    protected resourceService: BaseResourceService<T> ,
    protected jsonDataToResourceFn: (jsonData) => T
  ) {
    this.route = injector.get(ActivatedRoute);
    this.router = injector.get(Router);
    this.formBuilder = injector.get(FormBuilder);
   }

  ngOnInit() {
    this.setCurrentAction();
    this.buildResourceForm();
    this.loadResource();
  }

  ngAfterContentChecked(): void {
    this.setPageTitle();
  }

  protected setPageTitle() {
    if(this.currentAction == 'new')
    this.pageTitle = this.creationPageTitle();
    else{
      this.pageTitle = this.editionPageTitle();
    } 
  }

  protected editionPageTitle(): string {
    return "Edição";
  }

  protected creationPageTitle(): string {
    return "Novo";
  }

  submitForm() {
    this.submittingForm = true;
    if(this.currentAction == 'new')
    this.createResource();
    else
    this.updateResource();
  }
  
  createResource() {
    const resource: T = this.jsonDataToResourceFn(this.resourceForm.value);

    this.resourceService.create(resource)
    .subscribe(
      resource => this.actionsForSucces(resource),
      error => this.actionsForError(error)
    )
  }

  protected updateResource() {
    const resource: T = this.jsonDataToResourceFn(this.resourceForm.value);

    this.resourceService.update(resource)
    .subscribe(
      resource => this.actionsForSucces(resource),
      error => this.actionsForError(error)
    )
  }

  protected actionsForSucces(resource: T): void {
    toastr.success("Solicitação processada com sucesso!");

    const baseComponentPath: string = this.route.snapshot.parent.url[0].path;

    this.router.navigateByUrl(baseComponentPath, {skipLocationChange: true}).then(
      () => this.router.navigate([baseComponentPath, resource.id, "edit"])
    )
  }

  protected actionsForError(error){
    toastr.error("Ocorreu um erro ao processar a sua solicitação!");

    this.submittingForm = false;

    if(error.status === 422)
      this.serverErrorMessages = JSON.parse(error._body).errors;
    else
      this.serverErrorMessages = ["Falha na comunicação com o servidor. Por favor, tente mais tarde."]
  }

  protected loadResource() {
    if(this.currentAction == 'edit') {
      this.route.paramMap.pipe(
        switchMap(params => this.resourceService.getById(+params.get("id")))
      )
      .subscribe(
        (resource) => {
          this.resource = resource;
          this.resourceForm.patchValue(resource);
        },
        (error) => alert('Ocorreu um erro no servidor, tente mais tarde.') 
      )
    }
  }
  
  protected setCurrentAction() {
    if(this.route.snapshot.url[0].path == "new")
    this.currentAction = 'new'
    else
    this.currentAction = 'edit'
  }

  protected abstract buildResourceForm(): void;

}
