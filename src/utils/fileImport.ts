export const readJsonFile = <T = unknown>(file: File): Promise<T | null> => {
  return new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        resolve(jsonData as T);
      } catch (error) {
        console.error('Error parsing JSON file:', error);
        resolve(null);
      }
    };

    reader.onerror = () => {
      console.error('Error reading file');
      resolve(null);
    };

    reader.readAsText(file);
  });
};

interface ValidatedState<T> {
  characters: T[];
  bosses: T[];
  enemyGroups: T[];
  isValid: boolean;
}

export const validateImportedState = <T = unknown>(
  importedState: unknown
): ValidatedState<T> => {
  if (!importedState || typeof importedState !== 'object') {
    return {
      characters: [],
      bosses: [],
      enemyGroups: [],
      isValid: false,
    };
  }

  const state = importedState as Record<string, unknown>;

  return {
    characters: Array.isArray(state.characters) ? state.characters : [],
    bosses: Array.isArray(state.bosses) ? state.bosses : [],
    enemyGroups: Array.isArray(state.enemyGroups) ? state.enemyGroups : [],
    isValid: true,
  };
};

type ImportSuccessCallback<T> = (data: ValidatedState<T>) => void;
type ImportErrorCallback = (message: string) => void;
type FileInputChangeEvent = React.ChangeEvent<HTMLInputElement>;

export const createFileImportHandler = <T = unknown>(
  onImportSuccess: ImportSuccessCallback<T>,
  onImportError: ImportErrorCallback
) => {
  return async (event: FileInputChangeEvent) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const jsonData = await readJsonFile<T>(file);

    if (jsonData === null) {
      onImportError(
        "Failed to read or parse the selected file. Please ensure it's a valid JSON file."
      );
      return;
    }

    const validatedState = validateImportedState<T>(jsonData);

    if (!validatedState.isValid) {
      onImportError(
        'Invalid file format. The file does not contain expected data structure.'
      );
      return;
    }

    onImportSuccess(validatedState);

    event.target.value = '';
  };
};
