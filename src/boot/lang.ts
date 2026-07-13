import { boot } from 'quasar/wrappers';
import langRu from 'quasar/lang/ru';
import { Quasar } from 'quasar';

export default boot(() => {
  Quasar.lang.set(langRu);
});
