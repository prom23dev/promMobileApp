import test from 'node:test';
import assert from 'node:assert/strict';
import { franchiseErrors, franchiseValues } from '../src/forms/franchiseForm';
const base={'first-name':'UI Test',phone:'+995 555 123456',email:'qa@example.invalid',country:'Грузия',region:'Тбилиси','business-status':'Нет','warehouse-status':'Планирую',interests:['Опалубка']};
test('international applicant needs no Russian registration or warehouse',()=>{assert.deepEqual(franchiseErrors(base),{});assert.equal(franchiseValues(base)['has-warehouse'],false);});
test('international phone, location and choices are validated',()=>{for(const values of [{phone:'1234'},{phone:'+1234567890123456'},{country:'123'},{region:''},{interests:['Unknown']},{'business-status':''},{'warehouse-status':'Unknown'},{email:'bad'}])assert.ok(Object.keys(franchiseErrors({...base,...values})).length);});
test('warehouse details are conditional and stale hidden data is omitted',()=>{assert.ok(franchiseErrors({...base,'warehouse-status':'Да'})['warehouse-address']);const v=franchiseValues({...base,'company-name':'Old','inn':'Old','warehouse-address':'Old','warehouse-phone':'Old'});for(const key of ['company-name','inn','warehouse-address','warehouse-phone'])assert.equal(v[key],undefined);});
