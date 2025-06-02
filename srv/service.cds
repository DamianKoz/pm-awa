using { componentX as my} from '../db/schema.cds';

service DashboadService {

    entity Readings as projection on my.Readings;

}