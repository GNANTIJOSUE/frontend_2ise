import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { usePermissions } from '../hooks/usePermissions';

interface DeleteButtonProps {
  onDelete: () => void;
  permission: 'canDeleteStudents' | 'canDeleteTeachers';
  tooltip?: string;
  disabled?: boolean;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ 
  onDelete, 
  permission, 
  tooltip = "Supprimer",
  disabled = false
}) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return null; // Ne pas afficher le bouton si pas de permission
  }

  return (
    <Tooltip title={tooltip}>
      <span>
        <IconButton 
          onClick={onDelete}
          color="error"
          size="small"
          disabled={disabled}
          sx={{ 
            opacity: disabled ? 0.5 : 1 
          }}
        >
          <DeleteIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default DeleteButton; 